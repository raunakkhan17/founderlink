/**
 * multer-upload.test.ts
 *
 * Tests for Multer upload error handling:
 *  - 413  : oversized file (> 20 MB)   → LIMIT_FILE_SIZE → "File too large. Maximum size is 20 MB."
 *  - 400  : invalid file extension (.exe) → fileFilter rejection → "Only PDF, DOCX, PNG, and JPG files are allowed"
 *  - 201  : valid PDF upload succeeds
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { DocumentModel } from '../models/document.model';
import { config } from '../config/env';
import { generateAccessToken } from '../utils/token.util';

describe('Multer Upload Error Handling', () => {
  let founder: IUser;
  let token: string;
  let startup: IStartup;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    }

    await User.deleteMany({ email: 'multer.upload.test@example.com' });

    founder = await User.create({
      name: 'Multer Test Founder',
      email: 'multer.upload.test@example.com',
      passwordHash: 'dummyhash',
      role: 'founder',
      isEmailVerified: true,
      verificationStatus: 'approved',
    });

    token = generateAccessToken({
      userId: founder._id.toString(),
      role: founder.role,
      email: founder.email,
    });

    startup = await Startup.create({
      founderId: founder._id,
      name: 'Multer Test Startup',
      tagline: 'Testing file uploads',
      industry: 'SaaS',
      stage: 'mvp',
      problem: 'Upload errors crash the app',
      solution: 'Proper Multer error handling',
      status: 'pending',
    });
  });

  afterAll(async () => {
    try {
      await DocumentModel.deleteMany({ startupId: startup._id });
      await Startup.findByIdAndDelete(startup._id);
      await User.deleteMany({ email: 'multer.upload.test@example.com' });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('1. Valid PDF upload → 201', () => {
    it('should accept a valid PDF file and return 201', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 dummy pdf content for test');

      const res = await request(app)
        .post(`/api/startups/${startup._id}/documents`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Valid Pitch Deck')
        .field('type', 'pitchdeck')
        .field('accessLevel', 'public')
        .attach('file', pdfBuffer, { filename: 'pitch.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.title).toBe('Valid Pitch Deck');
      expect(res.body.data.document.fileUrl).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('2. Invalid file extension (.exe) → 400', () => {
    it('should return 400 with a clear message for a .exe file', async () => {
      const exeBuffer = Buffer.from('MZ malicious binary content');

      const res = await request(app)
        .post(`/api/startups/${startup._id}/documents`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Malware Doc')
        .field('type', 'other')
        .attach('file', exeBuffer, { filename: 'virus.exe', contentType: 'application/octet-stream' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only PDF, DOCX, PNG, and JPG files are allowed');
    });

    it('should return 400 for a .js file masquerading as valid', async () => {
      const jsBuffer = Buffer.from('console.log("hacked")');

      const res = await request(app)
        .post(`/api/startups/${startup._id}/documents`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Script Attack')
        .field('type', 'other')
        .attach('file', jsBuffer, { filename: 'payload.js', contentType: 'application/javascript' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only PDF, DOCX, PNG, and JPG files are allowed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('3. Oversized file (> 20 MB) → 413', () => {
    it('should return 413 with "File too large" message when file exceeds 20 MB', async () => {
      // Create a buffer just over the 20 MB limit (20 MB + 1 byte)
      const oversizedBuffer = Buffer.alloc(20 * 1024 * 1024 + 1, 'A');

      const res = await request(app)
        .post(`/api/startups/${startup._id}/documents`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Giant File')
        .field('type', 'financial')
        .attach('file', oversizedBuffer, { filename: 'huge.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('File too large. Maximum size is 20 MB.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('4. Unexpected field name → 400', () => {
    it('should return 400 when file is attached under wrong field name', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 dummy');

      const res = await request(app)
        .post(`/api/startups/${startup._id}/documents`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Test Doc')
        .field('type', 'other')
        // Wrong field name: "document" instead of "file"
        .attach('document', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

