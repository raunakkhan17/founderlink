import { Request, Response } from 'express';
import request from 'supertest';
import express from 'express';
import { authenticate, authorize, requireVerified, AuthRequest } from '../middleware/auth.middleware';
import { generateAccessToken } from '../utils/token.util';
import { User, IUser } from '../models/user.model';
import mongoose, { Types } from 'mongoose';
import { config } from '../config/env';

describe('Auth Middleware Unit Tests', () => {
  let mockUser: IUser;
  let testApp: express.Application;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    mockUser = await User.create({
      name: 'Middleware Tester',
      email: 'middleware.test@example.com',
      passwordHash: 'fakehash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });

    testApp = express();
    testApp.use(express.json());

    // Protected route: require founder or admin
    testApp.get(
      '/protected/founder-only',
      authenticate as any,
      authorize('founder', 'admin') as any,
      requireVerified as any,
      (req: Request, res: Response) => {
        res.status(200).json({ success: true, message: 'Welcome founder' });
      }
    );

    // Protected route: investor only
    testApp.get(
      '/protected/investor-only',
      authenticate as any,
      authorize('investor') as any,
      requireVerified as any,
      (req: Request, res: Response) => {
        res.status(200).json({ success: true, message: 'Welcome investor' });
      }
    );
  });

  afterAll(async () => {
    try {
      await User.deleteOne({ _id: mockUser._id });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('should allow verified founder with valid role', async () => {
    const token = generateAccessToken({
      userId: mockUser._id.toString(),
      role: 'founder',
      email: mockUser.email,
    });

    const res = await request(testApp)
      .get('/protected/founder-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome founder');
  });

  it('should reject access to investor-only route with 403 Forbidden', async () => {
    const token = generateAccessToken({
      userId: mockUser._id.toString(),
      role: 'founder',
      email: mockUser.email,
    });

    const res = await request(testApp)
      .get('/protected/investor-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('requireVerified should block unverified email with 403', async () => {
    await User.updateOne({ _id: mockUser._id }, { isEmailVerified: false });

    const token = generateAccessToken({
      userId: mockUser._id.toString(),
      role: 'founder',
      email: mockUser.email,
    });

    const res = await request(testApp)
      .get('/protected/founder-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.requiresEmailVerification).toBe(true);

    await User.updateOne({ _id: mockUser._id }, { isEmailVerified: true });
  });

  it('requireVerified should block pending admin approval with 403', async () => {
    await User.updateOne({ _id: mockUser._id }, { verificationStatus: 'pending' });

    const token = generateAccessToken({
      userId: mockUser._id.toString(),
      role: 'founder',
      email: mockUser.email,
    });

    const res = await request(testApp)
      .get('/protected/founder-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.verificationStatus).toBe('pending');

    await User.updateOne({ _id: mockUser._id }, { verificationStatus: 'approved' });
  });
});

