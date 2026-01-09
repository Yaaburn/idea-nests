import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { initializeConnectors } from './connectors/registry.js';
import { createSyncWorker, createAnalyzeWorker } from './jobs/queues.js';
import { libraryRoutes } from './routes/library.routes.js';

async function main() {
    // Initialize connectors
    initializeConnectors();

    // Create Fastify instance
    const fastify = Fastify({
        logger: false, // We use our own logger
    });

    // Register plugins
    await fastify.register(cors, {
        origin: config.NODE_ENV === 'development'
            ? ['http://localhost:5173', 'http://localhost:3000']
            : [], // Configure for production
        credentials: true,
    });

    await fastify.register(helmet);

    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    // Error handler
    fastify.setErrorHandler((error, request, reply) => {
        logger.error({
            err: error,
            url: request.url,
            method: request.method,
        }, 'Request error');

        // Zod validation errors
        if (error.name === 'ZodError') {
            return reply.status(400).send({
                error: 'validation_error',
                message: 'Invalid request data',
                details: JSON.parse(error.message),
            });
        }

        // Default error response
        return reply.status(error.statusCode ?? 500).send({
            error: 'internal_error',
            message: config.NODE_ENV === 'development'
                ? error.message
                : 'An unexpected error occurred',
        });
    });

    // Health check
    fastify.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: config.NODE_ENV,
        };
    });

    // Register routes
    await fastify.register(libraryRoutes);

    // Start workers
    const syncWorker = createSyncWorker();
    const analyzeWorker = createAnalyzeWorker();

    logger.info('Job workers started');

    // Graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down...');
        await syncWorker.close();
        await analyzeWorker.close();
        await fastify.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    try {
        await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
        logger.info({ port: config.PORT }, `Server listening on port ${config.PORT}`);
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
}

main().catch((err) => {
    logger.error({ err }, 'Unhandled error in main');
    process.exit(1);
});
