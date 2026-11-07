import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';
import { seedAdmin } from '../scripts/seedAdmin';

describe('Admin Protected Routes - GET /api/admin/ping', () => {
  let founderUser: IUser;
  let adminUser: IUser;
  let founderToken: string;
  let adminToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // Ensure seeded admin exists
    await seedAdmin();
    const seededAdmin = await User.findOne({ email: config.ADMIN_EMAIL.toLowerCase() });
    adminUser = seededAdmin!;
    adminToken = generateAccessToken({
      userId: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email,
    });

    // Create a founder user
    await User.deleteMany({ email: 'founder.adminping@example.com' });
    founderUser = await User.create({
      name: 'Ping Founder',
      email: 'founder.adminping@example.com',
      passwordHash: 'hashed_pw_dummy',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    founderToken = generateAccessToken({
      userId: founderUser._id.toString(),
      role: founderUser.role,
      email: founderUser.email,
    });
  });

  afterAll(async () => {
    try {
      await User.deleteMany({ email: 'founder.adminping@example.com' });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/ping');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No token provided');
  });

  it('should return 403 when a founder tries to access the route', async () => {
    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${founderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  it('should return 200 with { success: true, message: "admin ok" } for seeded admin', async () => {
    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'admin ok',
    });
  });
});

