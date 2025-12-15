import { createClient, RedisClientType } from 'redis';

import { getConfig } from './config';

let redisClient: RedisClientType;
let redisLegacyClient: RedisClientType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let isConnected = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let isLegacyConnected = false;

async function connectWithRetry(
  client: RedisClientType,
  maxRetries = 10,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      // Small delay to ensure connection is stable
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    } catch (error) {
      // If connection was established but then closed, disconnect before retry
      try {
        if (client.isOpen) {
          await client.quit().catch(() => {});
        }
      } catch {
        // Ignore disconnect errors
      }
      if (i === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff with max delay of 3 seconds
      const waitTime = Math.min(delayMs * (i + 1), 3000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

export async function getRedisClient() {
  if (!redisClient) {
    const { redisUrl } = getConfig();
    redisClient = createClient({
      url: redisUrl,
      socket: {
        tls: redisUrl.match(/rediss:/) != null,
        rejectUnauthorized: false,
        // Force IPv4 to avoid IPv6 connection issues with testcontainers
        family: 4,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection failed after 10 retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });
    // Suppress expected errors during connection attempts and reconnection
    redisClient.on('error', (err) => {
      // ECONNREFUSED and SocketClosedUnexpectedlyError are expected during
      // initial connection attempts and reconnection attempts
      const isExpectedError =
        err.code === 'ECONNREFUSED' ||
        err.message === 'Socket closed unexpectedly' ||
        err.message?.includes('Socket closed unexpectedly');

      if (!isExpectedError) {
        console.error('Redis Client Error', err);
      }
    });
    redisClient.on('connect', () => {
      isConnected = true;
    });
    await connectWithRetry(redisClient);
    isConnected = true;
  }

  return redisClient;
}

export async function getLegacyRedisClient() {
  if (!redisLegacyClient) {
    const { redisUrl } = getConfig();
    redisLegacyClient = createClient({
      url: redisUrl,
      legacyMode: true,
      socket: {
        tls: redisUrl.match(/rediss:/) != null,
        rejectUnauthorized: false,
        // Force IPv4 to avoid IPv6 connection issues with testcontainers
        family: 4,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection failed after 10 retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });
    // Suppress expected errors during connection attempts and reconnection
    redisLegacyClient.on('error', (err) => {
      // ECONNREFUSED and SocketClosedUnexpectedlyError are expected during
      // initial connection attempts and reconnection attempts
      const isExpectedError =
        err.code === 'ECONNREFUSED' ||
        err.message === 'Socket closed unexpectedly' ||
        err.message?.includes('Socket closed unexpectedly');

      if (!isExpectedError) {
        console.error('Redis Legacy Client Error', err);
      }
    });
    redisLegacyClient.on('connect', () => {
      isLegacyConnected = true;
    });
    await connectWithRetry(redisLegacyClient);
    isLegacyConnected = true;
  }

  return redisLegacyClient;
}

export async function closeRedisConnections() {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore errors during cleanup
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redisClient = null as any;
    isConnected = false;
  }
  if (redisLegacyClient && redisLegacyClient.isOpen) {
    try {
      await redisLegacyClient.quit();
    } catch {
      // Ignore errors during cleanup
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redisLegacyClient = null as any;
    isLegacyConnected = false;
  }
}
