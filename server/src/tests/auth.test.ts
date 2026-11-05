import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/user.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';
import { seedAdmin } from '../scripts/seedAdmin';

describe('Auth & Authorization Endpoints & Middleware', () => {
  const founderEmail = 'founder.test@example.com';
  const investorEmail = 'investor.test@example.com';
  const testPassword = 'Password123!';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }
    await User.deleteMany({
      email: { $in: [founderEmail, investorEmail, config.ADMIN_EMAIL.toLowerCase()] },
    });
    await User.syncIndexes();
  });

  afterAll(async () => {
    try {
      await User.deleteMany({
        email: { $in: [founderEmail, investorEmail, config.ADMIN_EMAIL.toLowerCase()] },
      });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  describe('1. POST /api/auth/register', () => {
    it('should register a founder with pending verification and email token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Founder',
          email: founderEmail,
          password: testPassword,
          role: 'founder',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(founderEmail);
      expect(res.body.data.user.role).toBe('founder');
      expect(res.body.data.user.isEmailVerified).toBe(false);
      expect(res.body.data.user.verificationStatus).toBe('pending');
      expect(res.body.data.verificationToken).toBeDefined();
      expect(res.body.data.verificationLink).toContain('/verify-email?token=');

      const savedUser = await User.findOne({ email: founderEmail });
      expect(savedUser).toBeDefined();
      expect(savedUser?.passwordHash).not.toBe(testPassword); // Hashed with bcrypt
    });

    it('should register an investor', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Investor',
          email: investorEmail,
          password: testPassword,
          role: 'investor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('investor');
    });

    it('should reject admin self-registration with 403', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Admin',
          email: 'admin.hacker@example.com',
          password: testPassword,
          role: 'admin',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin account cannot be self-registered');
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: founderEmail,
          password: testPassword,
          role: 'founder',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });
  });

  describe('2. POST /api/auth/login, /refresh, /logout', () => {
    let refreshTokenCookie: string;
    let accessToken: string;

    it('should login with valid credentials, return accessToken and httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: founderEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('refreshToken=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
      refreshTokenCookie = cookies[0];
    });

    it('should refresh token using httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should logout and clear refreshToken cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain('refreshToken=;');
    });
  });

  describe('3. Email Verification Flow', () => {
    it('should verify email with valid token and set isEmailVerified true', async () => {
      const user = await User.findOne({ email: founderEmail });
      expect(user?.emailVerificationToken).toBeDefined();

      const res = await request(app)
        .get(`/api/auth/verify-email?token=${user!.emailVerificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findOne({ email: founderEmail });
      expect(updated?.isEmailVerified).toBe(true);
      expect(updated?.emailVerificationToken).toBeNull();
    });

    it('should reject invalid or expired verification token with 400', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email?token=invalid_dummy_token');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });

  describe('4. Forgot & Reset Password Flow', () => {
    let resetToken: string;

    it('should return resetToken and resetLink on forgot-password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: founderEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.resetToken).toBeDefined();
      expect(res.body.data.resetLink).toContain('/reset-password?token=');
      resetToken = res.body.data.resetToken;
    });

    it('should reset password with valid token and allow login with new password', async () => {
      const newPassword = 'NewSecretPassword456!';
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: founderEmail,
          password: newPassword,
        });

      expect(loginRes.status).toBe(200);
    });
  });

  describe('5. Suspended Users & Lockout Limiting', () => {
    it('should block suspended user from logging in with 403', async () => {
      await User.updateOne({ email: founderEmail }, { isSuspended: true });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: founderEmail,
          password: 'NewSecretPassword456!',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspended');

      // Unsuspend for further tests
      await User.updateOne({ email: founderEmail }, { isSuspended: false });
    });

    it('should lock account after 5 failed login attempts with HTTP 423', async () => {
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: founderEmail,
            password: 'WrongPassword!',
          });
        expect(res.status).toBe(401);
      }

      // 6th attempt: account should be locked
      const lockRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: founderEmail,
          password: 'NewSecretPassword456!',
        });

      expect(lockRes.status).toBe(423);
      expect(lockRes.body.message).toContain('Account is temporarily locked');

      // Unlock for cleanup
      await User.updateOne({ email: founderEmail }, { lockUntil: null, loginAttempts: 0 });
    });
  });

  describe('6. Authorization & RBAC Middleware', () => {
    it('GET /api/auth/me should return current user when authenticated', async () => {
      const user = await User.findOne({ email: founderEmail });
      const token = generateAccessToken({
        userId: user!._id.toString(),
        role: user!.role,
        email: user!.email,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(founderEmail);
    });

    it('GET /api/auth/me should reject request without token with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('7. Admin Seeding Script', () => {
    it('should seed admin account into MongoDB from environment variables', async () => {
      await seedAdmin();
      const admin = await User.findOne({ email: config.ADMIN_EMAIL.toLowerCase() });
      expect(admin).toBeDefined();
      expect(admin?.role).toBe('admin');
      expect(admin?.isEmailVerified).toBe(true);
      expect(admin?.verificationStatus).toBe('approved');
    });
  });
});
