import Redis from 'ioredis';
import { config } from './env';

let redisClient: Redis | null = null;
let redisStatus: string = 'disconnected';

export const connectRedis = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // stop retrying
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    redisStatus = 'connected';
    console.log('[Redis] Redis client connected');
  });

  redisClient.on('ready', () => {
    redisStatus = 'ready';
  });

  redisClient.on('error', (err) => {
    redisStatus = 'error';
    console.warn('[Redis] Connection warning/error:', err.message);
  });

  redisClient.on('close', () => {
    redisStatus = 'closed';
  });

  redisClient.connect().catch((err) => {
    redisStatus = 'unreachable';
    console.warn('[Redis] Unable to establish initial Redis connection:', err.message);
  });

  return redisClient;
};

export const getRedisStatus = (): string => redisStatus;
export const getRedisClient = (): Redis | null => redisClient;

