import { createClient, RedisClientType } from 'redis';

import { getConfig } from './config';

let redisClient: RedisClientType;
let redisLegacyClient: RedisClientType;

export async function getRedisClient() {
  if (!redisClient) {
    const { redisUrl } = getConfig();
    redisClient = createClient({
      url: redisUrl,
      socket: {
        tls: redisUrl.match(/rediss:/) != null,
        rejectUnauthorized: false,
      },
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
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
      },
    });
    redisLegacyClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisLegacyClient.connect();
  }

  return redisLegacyClient;
}
