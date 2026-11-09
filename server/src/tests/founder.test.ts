import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { DocumentModel } from '../models/document.model';
import { AccessRequest } from '../models/accessRequest.model';
import { Connection } from '../models/connection.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';

describe('Founder Module Backend Tests', () => {
  let founderUser: IUser;
  let otherFounder: IUser;
  let investorUser: IUser;
  let founderToken: string;
  let otherFounderToken: string;
  let investorToken: string;
  let testStartup: IStartup;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up test data
    await User.deleteMany({
      email: { $in: ['founder1.test@example.com', 'founder2.test@example.com', 'investor1.test@example.com'] },
    });

    // Create founder 1
    founderUser = await User.create({
      name: 'Primary Founder',
      email: 'founder1.test@example.com',
      passwordHash: 'dummyhash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
      profileViewsCount: 42,
    });
    founderToken = generateAccessToken({
      userId: founderUser._id.toString(),
      role: founderUser.role,
      email: founderUser.email,
    });

    // Create founder 2 (other founder)
    otherFounder = await User.create({
      name: 'Secondary Founder',
      email: 'founder2.test@example.com',
      passwordHash: 'dummyhash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    otherFounderToken = generateAccessToken({
      userId: otherFounder._id.toString(),
      role: otherFounder.role,
      email: otherFounder.email,
    });

    // Create investor
    investorUser = await User.create({
      name: 'Venture Investor',
      email: 'investor1.test@example.com',
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
  });

  afterAll(async () => {
    try {
      await User.deleteMany({
        email: { $in: ['founder1.test@example.com', 'founder2.test@example.com', 'investor1.test@example.com'] },
      });
      if (testStartup) {
        await DocumentModel.deleteMany({ startupId: testStartup._id });
        await Startup.deleteMany({ founderId: { $in: [founderUser._id, otherFounder._id] } });
        await AccessRequest.deleteMany({ startupId: testStartup._id });
        await Connection.deleteMany({ founderId: founderUser._id });
      }
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  describe('1. Profile Management (GET/PUT /api/users/me & Avatar)', () => {
    it('GET /api/users/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('founder1.test@example.com');
    });

    it('PUT /api/users/me should update profile details', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${founderToken}`)
        .send({
          name: 'Primary Founder Updated',
          headline: 'Building the next big AI unicorn',
          bio: 'Passionate serial founder with 10+ years in deep tech.',
          location: 'San Francisco, CA',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Primary Founder Updated');
      expect(res.body.data.user.headline).toBe('Building the next big AI unicorn');
      expect(res.body.data.user.location).toBe('San Francisco, CA');
    });

    it('POST /api/users/me/avatar should upload avatar image', async () => {
      const fakeImageBuffer = Buffer.from('fake image data');

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${founderToken}`)
        .attach('avatar', fakeImageBuffer, 'avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatarUrl).toBeDefined();
      expect(res.body.data.avatarUrl).toContain('/avatars/');
    });
  });

  describe('2. Startups CRUD (POST/GET/PUT/DELETE /api/startups)', () => {
    it('POST /api/startups should create startup with status "pending"', async () => {
      const res = await request(app)
        .post('/api/startups')
        .set('Authorization', `Bearer ${founderToken}`)
        .send({
          name: 'Nexus Robotics',
          tagline: 'Autonomous AI warehouse robots',
          problem: 'Warehouse fulfillment bottlenecks',
          solution: 'Cooperative multi-agent robots',
          market: '$50B logistics robotics market',
          industry: 'Robotics',
          stage: 'seed',
          fundingAsk: 1500000,
          equityOffered: 15,
          team: [
            { name: 'John Founder', role: 'CEO' },
            { name: 'Jane Tech', role: 'CTO' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.startup.status).toBe('pending'); // Must start as pending
      expect(res.body.data.startup.name).toBe('Nexus Robotics');
      expect(res.body.data.startup.viewsCount).toBe(0);

      testStartup = res.body.data.startup;
    });

    it('POST /api/startups should reject investor from creating a startup', async () => {
      const res = await request(app)
        .post('/api/startups')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          name: 'Investor Fake Startup',
          industry: 'Finance',
          stage: 'mvp',
        });

      expect(res.status).toBe(403);
    });

    it('GET /api/startups should list founder\'s own startups', async () => {
      const res = await request(app)
        .get('/api/startups')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startups).toBeInstanceOf(Array);
      expect(res.body.data.startups.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.startups[0].name).toBe('Nexus Robotics');
    });

    it('PUT /api/startups/:id should allow owner founder to update startup', async () => {
      const res = await request(app)
        .put(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .send({
          tagline: 'Updated revolutionary logistics robots',
          fundingAsk: 2000000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.startup.tagline).toBe('Updated revolutionary logistics robots');
      expect(res.body.data.startup.fundingAsk).toBe(2000000);
    });

    it('PUT /api/startups/:id should forbid non-owner founder from updating startup', async () => {
      const res = await request(app)
        .put(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${otherFounderToken}`)
        .send({
          name: 'Hacked Startup',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You can only update your own startups');
    });
  });

  describe('3. Document Upload (POST /api/startups/:id/documents)', () => {
    let uploadedDocId: string;

    it('should upload a valid PDF document and store link in MongoDB', async () => {
      const dummyPdfBuffer = Buffer.from('%PDF-1.4 sample pdf content');

      const res = await request(app)
        .post(`/api/startups/${testStartup._id}/documents`)
        .set('Authorization', `Bearer ${founderToken}`)
        .field('title', 'Series Seed Pitch Deck')
        .field('type', 'pitchdeck')
        .field('accessLevel', 'locked')
        .attach('file', dummyPdfBuffer, 'pitch_deck.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.title).toBe('Series Seed Pitch Deck');
      expect(res.body.data.document.type).toBe('pitchdeck');
      expect(res.body.data.document.accessLevel).toBe('locked');
      expect(res.body.data.document.fileUrl).toBeDefined();

      uploadedDocId = res.body.data.document._id;
    });

    it('should upload a DOCX document', async () => {
      const dummyDocxBuffer = Buffer.from('PK sample docx content');

      const res = await request(app)
        .post(`/api/startups/${testStartup._id}/documents`)
        .set('Authorization', `Bearer ${founderToken}`)
        .field('title', 'Executive Summary')
        .field('type', 'legal')
        .field('accessLevel', 'approved_only')
        .attach('file', dummyDocxBuffer, 'summary.docx');

      expect(res.status).toBe(201);
      expect(res.body.data.document.title).toBe('Executive Summary');
    });

    it('should reject invalid document extension (e.g. .exe)', async () => {
      const fakeExeBuffer = Buffer.from('malicious binary');

      const res = await request(app)
        .post(`/api/startups/${testStartup._id}/documents`)
        .set('Authorization', `Bearer ${founderToken}`)
        .field('title', 'Malware Doc')
        .field('type', 'other')
        .attach('file', fakeExeBuffer, 'virus.exe');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only PDF, DOCX, PNG, and JPG files are allowed');
    });

    it('should reject non-owner founder from uploading documents', async () => {
      const dummyPdfBuffer = Buffer.from('%PDF-1.4 sample');

      const res = await request(app)
        .post(`/api/startups/${testStartup._id}/documents`)
        .set('Authorization', `Bearer ${otherFounderToken}`)
        .field('title', 'Intruder Document')
        .field('type', 'pitchdeck')
        .attach('file', dummyPdfBuffer, 'intruder.pdf');

      expect(res.status).toBe(403);
    });

    describe('4. Change Access Level & Delete Document', () => {
      it('PUT /api/documents/:id/access-level should update document accessLevel', async () => {
        const res = await request(app)
          .put(`/api/documents/${uploadedDocId}/access-level`)
          .set('Authorization', `Bearer ${founderToken}`)
          .send({ accessLevel: 'approved_only' });

        expect(res.status).toBe(200);
        expect(res.body.data.document.accessLevel).toBe('approved_only');
      });

      it('PUT /api/documents/:id/access-level should reject invalid accessLevel', async () => {
        const res = await request(app)
          .put(`/api/documents/${uploadedDocId}/access-level`)
          .set('Authorization', `Bearer ${founderToken}`)
          .send({ accessLevel: 'confidential' });

        expect(res.status).toBe(400);
      });

      it('DELETE /api/documents/:id should delete document', async () => {
        const res = await request(app)
          .delete(`/api/documents/${uploadedDocId}`)
          .set('Authorization', `Bearer ${founderToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const checkDoc = await DocumentModel.findById(uploadedDocId);
        expect(checkDoc).toBeNull();
      });
    });
  });

  describe('5. Founder Dashboard Stats (GET /api/founder/stats)', () => {
    beforeAll(async () => {
      // Create sample access request
      const doc = await DocumentModel.create({
        startupId: testStartup._id,
        title: 'Financials 2026',
        type: 'financial',
        fileUrl: 'https://storage.founderlink.com/financials.pdf',
        accessLevel: 'locked',
      });

      await AccessRequest.create({
        investorId: investorUser._id,
        documentId: doc._id,
        startupId: testStartup._id,
        status: 'pending',
      });

      // Create sample connection request
      await Connection.create({
        founderId: founderUser._id,
        investorId: investorUser._id,
        startupId: testStartup._id,
        status: 'pending',
      });

      // Add views to startup
      await Startup.updateOne({ _id: testStartup._id }, { viewsCount: 15 });
    });

    it('should return aggregated founder stats', async () => {
      const res = await request(app)
        .get('/api/founder/stats')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.profileViews).toBe(42);
      expect(res.body.data.stats.startupViews).toBeGreaterThanOrEqual(15);
      expect(res.body.data.stats.accessRequests.pending).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.connectionRequests.pending).toBeGreaterThanOrEqual(1);
      expect(res.body.data.recentActivity).toBeDefined();
    });
  });

  describe('6. Handle Access and Connection Requests (Approve / Reject)', () => {
    let pendingAccessReqId: string;
    let pendingConnectionReqId: string;

    it('GET /api/founder/access-requests should list access requests for founder\'s startups', async () => {
      const res = await request(app)
        .get('/api/founder/access-requests')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessRequests).toBeInstanceOf(Array);
      expect(res.body.data.accessRequests.length).toBeGreaterThanOrEqual(1);

      pendingAccessReqId = res.body.data.accessRequests[0]._id;
    });

    it('PUT /api/founder/access-requests/:id should approve access request', async () => {
      const res = await request(app)
        .put(`/api/founder/access-requests/${pendingAccessReqId}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessRequest.status).toBe('approved');
    });

    it('GET /api/founder/connections should list connection requests', async () => {
      const res = await request(app)
        .get('/api/founder/connections')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connections).toBeInstanceOf(Array);
      expect(res.body.data.connections.length).toBeGreaterThanOrEqual(1);

      pendingConnectionReqId = res.body.data.connections[0]._id;
    });

    it('PUT /api/founder/connections/:id should accept connection request', async () => {
      const res = await request(app)
        .put(`/api/founder/connections/${pendingConnectionReqId}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body.data.connection.status).toBe('accepted');
    });
  });
});

