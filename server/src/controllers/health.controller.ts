import { Request, Response } from 'express';
import { getMongoStatus } from '../config/database';
import { getRedisStatus } from '../config/redis';

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: getMongoStatus(),
      redis: getRedisStatus(),
    },
    version: '1.0.0',
  });
};

