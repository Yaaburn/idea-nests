import { Provider } from '@prisma/client';
import type { IConnector } from './interface.js';
import { SheetsConnector } from './sheets.connector.js';
import { DriveConnector } from './drive.connector.js';
import { CalendarConnector } from './calendar.connector.js';

/**
 * ConnectorRegistry - Central registry for all connectors
 * Allows easy extension for future providers (GitHub, Notion, etc.)
 */
class ConnectorRegistry {
    private connectors = new Map<Provider, IConnector>();

    register(connector: IConnector): void {
        this.connectors.set(connector.provider, connector);
    }

    get(provider: Provider): IConnector | undefined {
        return this.connectors.get(provider);
    }

    getOrThrow(provider: Provider): IConnector {
        const connector = this.connectors.get(provider);
        if (!connector) {
            throw new Error(`No connector registered for provider: ${provider}`);
        }
        return connector;
    }

    list(): IConnector[] {
        return Array.from(this.connectors.values());
    }

    has(provider: Provider): boolean {
        return this.connectors.has(provider);
    }

    /**
     * Get list of providers that are "coming soon" (not yet implemented)
     */
    getComingSoon(): string[] {
        return ['GITHUB', 'NOTION', 'TRELLO', 'SLACK', 'FIGMA'];
    }
}

// Global registry singleton
export const connectorRegistry = new ConnectorRegistry();

// Register all V1 connectors
export function initializeConnectors(): void {
    connectorRegistry.register(new SheetsConnector());
    connectorRegistry.register(new DriveConnector());
    connectorRegistry.register(new CalendarConnector());
}
