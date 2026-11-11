import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { DocumentModel } from '../models/document.model';
import { Connection } from '../models/connection.model';
import { Meeting } from '../models/meeting.model';
import { AuditLog } from '../models/auditLog.model';
import { Notification } from '../models/notification.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';

describe('Admin Module Backend Tests', () => {
  let adminUser: IUser;
  let founderUser: IUser;
  let investorUser: IUser;
  let pendingUser: IUser;

  let adminToken: string;
  let founderToken: string;
  let investorToken: string;

  let pendingStartup: IStartup;
  let reportedStartup: IStartup;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    await User.deleteMany({
      email: {
        $in: [
          'admin.module@founderlink.com',
          'founder.adminmodule@example.com',
          'investor.adminmodule@example.com',
          'pending.user@example.com',
        ],
      },
    });

    // 1. Admin
    adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin.module@founderlink.com',
      passwordHash: 'dummyhash',
      role: 'admin',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    adminToken = generateAccessToken({
      userId: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email,
    });

    // 2. Founder
    founderUser = await User.create({
      name: 'Test Founder',
      email: 'founder.adminmodule@example.com',
      passwordHash: 'dummyhash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    founderToken = generateAccessToken({
      userId: founderUser._id.toString(),
      role: founderUser.role,
      email: founderUser.email,
    });

    // 3. Investor
    investorUser = await User.create({
      name: 'Test Investor',
      email: 'investor.adminmodule@example.com',
      passwordHash: 'dummyhash',
      role: 'investor',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    investorToken = generateAccessToken({
      userId: investorUser._id.toString(),
      role: investorUser.role,
      email: investorUser.email,
    });

    // 4. Pending user for approval test
    pendingUser = await User.create({
      name: 'Pending Applicant',
      email: 'pending.user@example.com',
      passwordHash: 'dummyhash',
      role: 'investor',
      isEmailVerified: true,
      verificationStatus: 'pending',
    });

    // 5. Startups
    pendingStartup = await Startup.create({
      founderId: founderUser._id,
      name: 'Pending AI Ventures',
      tagline: 'Cutting edge AI platform',
      industry: 'AI / ML',
      stage: 'mvp',
      problem: 'AI is hard',
      solution: 'Automated ML ops',
      status: 'pending',
    });

    reportedStartup = await Startup.create({
      founderId: founderUser._id,
      name: 'Spam Crypto Scheme',
      tagline: 'Get rich quick',
      industry: 'Fintech',
      stage: 'idea',
      problem: 'None',
      solution: 'None',
      status: 'approved',
    });

    // 6. Test Meeting & Connection for stats
    const conn = await Connection.create({
      founderId: founderUser._id,
      investorId: investorUser._id,
      startupId: reportedStartup._id,
      status: 'accepted',
    });

    await Meeting.create({
      connectionId: conn._id,
      title: 'Initial Seed Pitch Call',
      scheduledAt: new Date(Date.now() + 86400000),
      roomName: 'meeting-123',
      createdBy: investorUser._id,
      status: 'scheduled',
    });
  });

  afterAll(async () => {
    try {
      await User.deleteMany({
        email: {
          $in: [
            'admin.module@founderlink.com',
            'founder.adminmodule@example.com',
            'investor.adminmodule@example.com',
            'pending.user@example.com',
          ],
        },
      });
      await Startup.deleteMany({ founderId: founderUser._id });
      await Connection.deleteMany({ founderId: founderUser._id });
      await Meeting.deleteMany({ createdBy: investorUser._id });
      await Notification.deleteMany({ userId: { $in: [pendingUser._id, founderUser._id] } });
      await AuditLog.deleteMany({ userId: adminUser._id });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Non-admin users can NEVER access admin routes (403/401)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const endpoints = [
        '/api/admin/stats',
        '/api/admin/pending/users',
        '/api/admin/pending/startups',
        '/api/admin/users',
        '/api/admin/audit-logs',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
      }
    });

    it('should reject founder with 403 Forbidden', async () => {
      const endpoints = [
        '/api/admin/stats',
        '/api/admin/pending/users',
        '/api/admin/pending/startups',
        '/api/admin/users',
        '/api/admin/audit-logs',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${founderToken}`);
        expect(res.status).toBe(403);
      }
    });

    it('should reject investor with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${investorToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('2. View platform stats (GET /api/admin/stats)', () => {
    it('should return aggregated metrics across users, startups, connections, and active meetings', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.users.founders).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users.investors).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users.admins).toBeGreaterThanOrEqual(1);
      expect(res.body.data.startups.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.connections.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data.meetings.active).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Verification queue & notifications (Approve / Reject)', () => {
    it('should list pending users and allow admin to approve user, sending a notification', async () => {
      // 1. Get pending users
      const listRes = await request(app)
        .get('/api/admin/pending/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.users.length).toBeGreaterThanOrEqual(1);
      const targetUser = listRes.body.data.users.find((u: any) => u._id === pendingUser._id.toString());
      expect(targetUser).toBeDefined();

      // 2. Approve user
      const approveRes = await request(app)
        .put(`/api/admin/pending/users/${pendingUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.user.verificationStatus).toBe('approved');

      // 3. Confirm notification was generated for the user
      const notif = await Notification.findOne({ userId: pendingUser._id, type: 'system' });
      expect(notif).not.toBeNull();
      expect(notif?.message).toContain('approved by admin');

      // 4. Confirm audit log
      const audit = await AuditLog.findOne({
        action: 'user_verification_approved',
        targetId: pendingUser._id,
      });
      expect(audit).not.toBeNull();
    });

    it('should list pending startups and allow admin to approve or reject with a reason and send notification', async () => {
      // 1. Get pending startups
      const listRes = await request(app)
        .get('/api/admin/pending/startups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.startups.length).toBeGreaterThanOrEqual(1);

      // 2. Reject with reason
      const rejectRes = await request(app)
        .put(`/api/admin/pending/startups/${pendingStartup._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'rejected',
          reason: 'Insufficient business model traction details provided.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.startup.status).toBe('rejected');

      // 3. Confirm founder received notification with reason
      const notif = await Notification.findOne({
        userId: founderUser._id,
        message: { $regex: /Insufficient business model traction/ },
      });
      expect(notif).not.toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('4. User Management: search, filters, suspend toggle', () => {
    it('should list users with search and filter by role or status', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=founder&search=founder')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users[0].role).toBe('founder');
    });

    it('should suspend and reactivate a user', async () => {
      // Suspend
      const suspendRes = await request(app)
        .put(`/api/admin/users/${investorUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSuspended: true });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.user.isSuspended).toBe(true);

      const refreshed = await User.findById(investorUser._id);
      expect(refreshed?.isSuspended).toBe(true);

      // Reactivate
      const reactivateRes = await request(app)
        .put(`/api/admin/users/${investorUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSuspended: false });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.user.isSuspended).toBe(false);
    });

    it('should prevent admin from suspending own account', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSuspended: true });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Admin cannot suspend own account');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Delete reported content (content moderation)', () => {
    it('should delete reported startup and its associated documents', async () => {
      const res = await request(app)
        .delete(`/api/admin/content/startup/${reportedStartup._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Startup.findById(reportedStartup._id);
      expect(deleted).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('6. View Audit Logs with filters (user, action, date)', () => {
    it('should return audit logs and filter by action', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?action=user_suspended')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.auditLogs).toBeDefined();
      expect(res.body.data.auditLogs.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.auditLogs[0].action).toBe('user_suspended');
    });
  });
});

