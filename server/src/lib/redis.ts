import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
    logger.info('Redis connected');
});
