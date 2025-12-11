import { createClient, RedisClientType } from 'redis';

import { getConfig } from './config';

let redisClient: RedisClientType;
let redisLegacyClient: RedisClientType;

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
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await connectWithRetry(redisClient);
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
    redisLegacyClient.on('error', (err) => console.error('Redis Client Error', err));
    await connectWithRetry(redisLegacyClient);
  }

  return redisLegacyClient;
}
