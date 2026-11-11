import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { DocumentModel, IDocument } from '../models/document.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';

describe('Document Access Level Route Tests (PUT /api/documents/:id/access-level)', () => {
  let ownerFounder: IUser;
  let otherFounder: IUser;
  let ownerToken: string;
  let otherFounderToken: string;
  let startup: IStartup;
  let testDoc: IDocument;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    await User.deleteMany({
      email: { $in: ['doc.owner@example.com', 'doc.intruder@example.com'] },
    });

    ownerFounder = await User.create({
      name: 'Document Owner Founder',
      email: 'doc.owner@example.com',
      passwordHash: 'dummyhash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });

    ownerToken = generateAccessToken({
      userId: ownerFounder._id.toString(),
      role: ownerFounder.role,
      email: ownerFounder.email,
    });

    otherFounder = await User.create({
      name: 'Other Founder',
      email: 'doc.intruder@example.com',
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

    startup = await Startup.create({
      founderId: ownerFounder._id,
      name: 'AccessLevel Test Startup',
      tagline: 'Testing document permissions',
      industry: 'SaaS',
      stage: 'mvp',
      problem: 'Need fine-grained document access controls',
      solution: 'Role-based access levels',
      status: 'approved',
    });

    testDoc = await DocumentModel.create({
      startupId: startup._id,
      title: 'Confidential Pitch Deck',
      type: 'pitchdeck',
      fileUrl: 'https://storage.founderlink.com/pitch.pdf',
      accessLevel: 'locked',
    });
  });

  afterAll(async () => {
    try {
      await DocumentModel.deleteMany({ startupId: startup._id });
      await Startup.findByIdAndDelete(startup._id);
      await User.deleteMany({
        email: { $in: ['doc.owner@example.com', 'doc.intruder@example.com'] },
      });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('1. The founder who owns the startup can change accessLevel to public, locked, and approved_only', async () => {
    const validLevels = ['public', 'approved_only', 'locked'] as const;

    for (const level of validLevels) {
      const res = await request(app)
        .put(`/api/documents/${testDoc._id}/access-level`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ accessLevel: level });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.accessLevel).toBe(level);

      const refreshed = await DocumentModel.findById(testDoc._id);
      expect(refreshed?.accessLevel).toBe(level);
    }
  });

  it('2. An invalid value like "secret" returns 400', async () => {
    const res = await request(app)
      .put(`/api/documents/${testDoc._id}/access-level`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ accessLevel: 'secret' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid access level');
  });

  it('3. Another founder gets 403', async () => {
    const res = await request(app)
      .put(`/api/documents/${testDoc._id}/access-level`)
      .set('Authorization', `Bearer ${otherFounderToken}`)
      .send({ accessLevel: 'public' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });
});

