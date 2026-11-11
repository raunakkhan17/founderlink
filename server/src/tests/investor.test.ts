import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { DocumentModel, IDocument } from '../models/document.model';
import { AccessRequest } from '../models/accessRequest.model';
import { Connection } from '../models/connection.model';
import { AuditLog } from '../models/auditLog.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';

describe('Investor Module & Access Rules Backend Tests', () => {
  let founderUser: IUser;
  let investorUser: IUser;
  let otherInvestor: IUser;
  let founderToken: string;
  let investorToken: string;
  let otherInvestorToken: string;

  let approvedStartup: IStartup;
  let pendingStartup: IStartup;

  let publicDoc: IDocument;
  let lockedDoc: IDocument;
  let approvedOnlyDoc: IDocument;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean test data
    await User.deleteMany({
      email: { $in: ['inv.founder@example.com', 'inv.investor1@example.com', 'inv.investor2@example.com'] },
    });

    founderUser = await User.create({
      name: 'Startup Founder',
      email: 'inv.founder@example.com',
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

    investorUser = await User.create({
      name: 'Alpha Investor',
      email: 'inv.investor1@example.com',
      passwordHash: 'dummyhash',
      role: 'investor',
      isEmailVerified: true,
      verificationStatus: 'approved',
      investorProfile: {
        interests: ['CleanTech', 'AI'],
        ticketMin: 50000,
        ticketMax: 250000,
        pastInvestments: ['EcoBattery Inc.'],
      },
    });
    investorToken = generateAccessToken({
      userId: investorUser._id.toString(),
      role: investorUser.role,
      email: investorUser.email,
    });

    otherInvestor = await User.create({
      name: 'Beta Investor',
      email: 'inv.investor2@example.com',
      passwordHash: 'dummyhash',
      role: 'investor',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });
    otherInvestorToken = generateAccessToken({
      userId: otherInvestor._id.toString(),
      role: otherInvestor.role,
      email: otherInvestor.email,
    });

    // Create approved startup
    approvedStartup = await Startup.create({
      founderId: founderUser._id,
      name: 'SolarNova Tech',
      tagline: 'Next generation perovskite solar modules',
      industry: 'CleanTech',
      stage: 'seed',
      problem: 'Solar panels have low efficiency ceiling',
      solution: 'Tandem perovskite cells with 32% efficiency',
      fundingAsk: 1500000,
      equityOffered: 15,
      status: 'approved',
      viewsCount: 10,
    });

    // Create pending startup (should be hidden in investor browse)
    pendingStartup = await Startup.create({
      founderId: founderUser._id,
      name: 'Secret Stealth AI',
      tagline: 'Autonomous AI agents for quantum computing',
      industry: 'AI / ML',
      stage: 'idea',
      problem: 'Quantum computing is hard to program',
      solution: 'Self-writing quantum algorithms',
      fundingAsk: 5000000,
      status: 'pending',
    });

    // Create documents with the 3 access levels
    publicDoc = await DocumentModel.create({
      startupId: approvedStartup._id,
      title: 'SolarNova One-Pager',
      type: 'pitchdeck',
      fileUrl: 'https://storage.founderlink.com/public-onepager.pdf',
      accessLevel: 'public',
    });

    lockedDoc = await DocumentModel.create({
      startupId: approvedStartup._id,
      title: 'SolarNova Full Financial Model',
      type: 'financial',
      fileUrl: 'https://storage.founderlink.com/locked-financials.pdf',
      accessLevel: 'locked',
    });

    approvedOnlyDoc = await DocumentModel.create({
      startupId: approvedStartup._id,
      title: 'SolarNova Patent & Cap Table',
      type: 'legal',
      fileUrl: 'https://storage.founderlink.com/approved-captable.pdf',
      accessLevel: 'approved_only',
    });
  });

  afterAll(async () => {
    try {
      if (approvedStartup) {
        await DocumentModel.deleteMany({ startupId: approvedStartup._id });
        await AccessRequest.deleteMany({ startupId: approvedStartup._id });
        await Connection.deleteMany({ startupId: approvedStartup._id });
        await AuditLog.deleteMany({ targetId: { $in: [approvedStartup._id, publicDoc?._id, lockedDoc?._id, approvedOnlyDoc?._id] } });
        await Startup.deleteMany({ _id: { $in: [approvedStartup._id, pendingStartup?._id] } });
      }
      await User.deleteMany({
        email: { $in: ['inv.founder@example.com', 'inv.investor1@example.com', 'inv.investor2@example.com'] },
      });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Document Access Rules (Public, Locked, Approved-Only) & Signed URLs', () => {
    it('public: any logged-in investor can open without request; returns short-lived signed URL and logs in auditLogs', async () => {
      const res = await request(app)
        .get(`/api/documents/${publicDoc._id}/access`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signedUrl).toBeDefined();
      expect(res.body.data.signedUrl).toContain('signature=');
      expect(res.body.data.signedUrl).toContain('expires=');
      expect(res.body.data.expiresIn).toBe(300);

      // Verify auditLog entry
      const log = await AuditLog.findOne({
        userId: investorUser._id,
        action: 'document_view',
        targetId: publicDoc._id,
      });
      expect(log).not.toBeNull();
      expect(log?.targetType).toBe('document');
    });

    it('locked: investor cannot open without approved request; returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/documents/${lockedDoc._id}/access`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
      expect(res.body.message).toContain('locked');
    });

    it('locked: investor submits access request, founder approves, then investor can open document', async () => {
      // 1. Investor submits access request
      const reqRes = await request(app)
        .post('/api/access-requests')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({ documentId: lockedDoc._id });

      expect(reqRes.status).toBe(201);
      expect(reqRes.body.success).toBe(true);
      const accessRequestId = reqRes.body.data.accessRequest._id;

      // 2. Founder approves the access request
      const approveRes = await request(app)
        .put(`/api/founder/access-requests/${accessRequestId}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .send({ status: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.accessRequest.status).toBe('approved');

      // 3. Investor now opens locked document
      const viewRes = await request(app)
        .get(`/api/documents/${lockedDoc._id}/access`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.data.signedUrl).toBeDefined();
      expect(viewRes.body.data.expiresIn).toBe(300);

      // Other investor who didn't request still gets 403
      const otherRes = await request(app)
        .get(`/api/documents/${lockedDoc._id}/access`)
        .set('Authorization', `Bearer ${otherInvestorToken}`);
      expect(otherRes.status).toBe(403);
    });

    it('approved_only: investor cannot open without approved request or accepted connection; returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/documents/${approvedOnlyDoc._id}/access`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('approved access request or accepted connection');
    });

    it('approved_only: investor with accepted connection can open document', async () => {
      // 1. Investor creates connection request to founder
      const connRes = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          startupId: approvedStartup._id,
          message: 'Interested in leading your Seed round!',
        });

      expect(connRes.status).toBe(201);
      const connectionId = connRes.body.data.connection._id;

      // 2. Founder accepts connection request
      const acceptRes = await request(app)
        .put(`/api/founder/connections/${connectionId}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .send({ status: 'accepted' });

      expect(acceptRes.status).toBe(200);

      // 3. Now investor can access approved_only document
      const docRes = await request(app)
        .get(`/api/documents/${approvedOnlyDoc._id}/access`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(docRes.status).toBe(200);
      expect(docRes.body.data.signedUrl).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('2. GET /api/startups (Marketplace Browse: approved only, search, filters, sort, pagination)', () => {
    it('should only return approved startups; pending startups are omitted', async () => {
      const res = await request(app)
        .get('/api/startups?browse=true')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startups).toBeDefined();

      const names = res.body.data.startups.map((s: any) => s.name);
      expect(names).toContain('SolarNova Tech');
      expect(names).not.toContain('Secret Stealth AI');
    });

    it('should filter startups by search keyword', async () => {
      const res = await request(app)
        .get('/api/startups?search=SolarNova')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startups.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.startups[0].name).toBe('SolarNova Tech');
    });

    it('should filter startups by industry and stage', async () => {
      const res = await request(app)
        .get('/api/startups?industry=CleanTech&stage=seed')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startups.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.startups[0].industry).toBe('CleanTech');

      const emptyRes = await request(app)
        .get('/api/startups?industry=Fintech')
        .set('Authorization', `Bearer ${investorToken}`);
      expect(emptyRes.body.data.startups.length).toBe(0);
    });

    it('should filter startups by funding range and sort', async () => {
      const res = await request(app)
        .get('/api/startups?minFunding=1000000&maxFunding=2000000&sort=funding_desc')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startups.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.startups[0].fundingAsk).toBe(1500000);
    });

    it('should support pagination (page and limit)', async () => {
      const res = await request(app)
        .get('/api/startups?browse=true&page=1&limit=5')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(5);
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.totalPages).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('3. GET /api/startups/:id (Full details & Once-per-day view count increment)', () => {
    it('should return startup details with documents and increment view count once per investor per day', async () => {
      // Clear previous audit view logs for clean test
      await AuditLog.deleteMany({ userId: investorUser._id, action: 'startup_view', targetId: approvedStartup._id });
      approvedStartup.viewsCount = 10;
      await approvedStartup.save();

      // First view today by investor
      const res1 = await request(app)
        .get(`/api/startups/${approvedStartup._id}`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.startup.name).toBe('SolarNova Tech');
      expect(res1.body.data.documents.length).toBeGreaterThanOrEqual(3);

      const refreshed1 = await Startup.findById(approvedStartup._id);
      expect(refreshed1?.viewsCount).toBe(11);

      // Second view today by SAME investor should NOT increment viewsCount
      const res2 = await request(app)
        .get(`/api/startups/${approvedStartup._id}`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res2.status).toBe(200);
      const refreshed2 = await Startup.findById(approvedStartup._id);
      expect(refreshed2?.viewsCount).toBe(11); // stays 11
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Watchlist (Save / Unsave) & Investor Profile Edit', () => {
    it('should save and unsave startup to investor watchlist', async () => {
      // Save startup
      const saveRes = await request(app)
        .post(`/api/startups/${approvedStartup._id}/save`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      // Check watchlist
      const watchlistRes = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(watchlistRes.status).toBe(200);
      const savedIds = watchlistRes.body.data.savedStartups.map((s: any) => s._id.toString());
      expect(savedIds).toContain(approvedStartup._id.toString());

      // Unsave startup
      const unsaveRes = await request(app)
        .delete(`/api/startups/${approvedStartup._id}/save`)
        .set('Authorization', `Bearer ${investorToken}`);

      expect(unsaveRes.status).toBe(200);

      // Check watchlist again
      const watchlistAfter = await request(app)
        .get('/api/investor/saved')
        .set('Authorization', `Bearer ${investorToken}`);
      const afterIds = watchlistAfter.body.data.savedStartups.map((s: any) => s._id.toString());
      expect(afterIds).not.toContain(approvedStartup._id.toString());
    });

    it('GET & PUT /api/investor/profile should view and update investor profile details', async () => {
      const updateRes = await request(app)
        .put('/api/investor/profile')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          headline: 'Managing Director @ Green Horizon Capital',
          bio: 'Investing $100k-$500k in breakthrough decarbonization technologies.',
          interests: ['CleanTech', 'Renewables', 'ClimateTech'],
          ticketMin: 100000,
          ticketMax: 500000,
          pastInvestments: ['EcoBattery Inc.', 'HydroPower Next'],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.user.headline).toBe('Managing Director @ Green Horizon Capital');
      expect(updateRes.body.data.user.investorProfile.ticketMin).toBe(100000);
      expect(updateRes.body.data.user.investorProfile.ticketMax).toBe(500000);
      expect(updateRes.body.data.user.investorProfile.interests).toEqual(['CleanTech', 'Renewables', 'ClimateTech']);
      expect(updateRes.body.data.user.investorProfile.pastInvestments).toContain('HydroPower Next');
    });

    it('should reject duplicate connection requests with 409 Conflict', async () => {
      // Investor already has connection request from earlier test
      const dupRes = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          startupId: approvedStartup._id,
          message: 'Duplicate request',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
    });

    it('GET /api/investor/requests should return combined accessRequests and connections', async () => {
      const res = await request(app)
        .get('/api/investor/requests')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessRequests).toBeDefined();
      expect(res.body.data.connections).toBeDefined();
      expect(res.body.data.accessRequests.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.connections.length).toBeGreaterThanOrEqual(1);
    });
  });
});
