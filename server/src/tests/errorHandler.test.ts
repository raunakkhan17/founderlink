import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middleware/errorHandler';

describe('Global Error Handler Middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  const createAppWithFailingRoute = () => {
    const app = express();
    app.use(express.json());

    app.get('/test-error', (_req: Request, _res: Response, _next: NextFunction) => {
      const error: any = new Error('Sensitive database connection failure details');
      error.statusCode = 500;
      throw error;
    });

    app.use(errorHandler);
    return app;
  };

  it('should include the stack field when NODE_ENV is "development"', async () => {
    process.env.NODE_ENV = 'development';
    const app = createAppWithFailingRoute();

    const res = await request(app).get('/test-error');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(500);
    expect(res.body.stack).toBeDefined();
    expect(typeof res.body.stack).toBe('string');
  });

  it('should NOT include the stack field and return only success, status, and safe message when NODE_ENV is "production"', async () => {
    process.env.NODE_ENV = 'production';
    const app = createAppWithFailingRoute();

    const res = await request(app).get('/test-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      status: 500,
      message: 'Internal Server Error',
    });
    expect(res.body.stack).toBeUndefined();
  });
});

