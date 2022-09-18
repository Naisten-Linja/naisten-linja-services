import { createClient, RedisClientType } from 'redis';

import { getConfig } from './config';

let redisClient: RedisClientType;
let redisLegacyClient: RedisClientType;

export async function getRedisClient() {
  if (!redisClient) {
    const { redisUrl } = getConfig();
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', () => {});
    await redisClient.connect();
  }

  return redisClient;
}

export async function getLegacyRedisClient() {
  if (!redisLegacyClient) {
    const { redisUrl } = getConfig();
    redisLegacyClient = createClient({ url: redisUrl, legacyMode: true });
    redisLegacyClient.on('error', () => {});
    await redisLegacyClient.connect();
  }

  return redisLegacyClient;
}
