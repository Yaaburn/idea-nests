import crypto from 'node:crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * SecretsProvider - Abstraction for encrypting/decrypting sensitive data
 * V1: Uses AES-256-GCM with key from environment
 * V2: Can swap to GCP Secret Manager / AWS Secrets Manager
 */
export class SecretsProvider {
    private key: Buffer;

    constructor() {
        // Key should be 32 bytes for AES-256
        const keyHex = config.SECRETS_ENCRYPTION_KEY;
        this.key = Buffer.from(keyHex.padEnd(64, '0').slice(0, 64), 'hex');
    }

    /**
     * Encrypts a string value
     * Returns: base64 encoded string of (iv + authTag + ciphertext)
     */
    encrypt(plaintext: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        // Combine: iv (16) + authTag (16) + ciphertext
        const combined = Buffer.concat([iv, authTag, encrypted]);

        return combined.toString('base64');
    }

    /**
     * Decrypts a base64 encoded encrypted value
     */
    decrypt(encryptedBase64: string): string {
        const combined = Buffer.from(encryptedBase64, 'base64');

        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }

    /**
     * Encrypts OAuth tokens object
     */
    encryptTokens(tokens: OAuthTokens): string {
        return this.encrypt(JSON.stringify(tokens));
    }

    /**
     * Decrypts OAuth tokens object
     */
    decryptTokens(encrypted: string): OAuthTokens {
        const json = this.decrypt(encrypted);
        return JSON.parse(json) as OAuthTokens;
    }
}

export interface OAuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp
    scope?: string;
}

// Singleton instance
export const secretsProvider = new SecretsProvider();
