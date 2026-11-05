import mongoose, { Types } from 'mongoose';
import {
  User,
  Startup,
  DocumentModel,
  AccessRequest,
  Connection,
  Message,
  Meeting,
  Metric,
  Notification,
  AuditLog,
} from '../models';

describe('Mongoose Models Unit Tests', () => {
  describe('User Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const user = new User({});
      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.email).toBeDefined();
      expect(err?.errors.passwordHash).toBeDefined();
    });

    it('should fail validation on invalid email format', async () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'invalid-email-address',
        passwordHash: 'hash123',
      });
      const err = user.validateSync();
      expect(err?.errors.email).toBeDefined();
      expect(err?.errors.email.message).toContain('Please provide a valid email');
    });

    it('should fail validation on invalid role enum', async () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hash123',
        role: 'superadmin' as any,
      });
      const err = user.validateSync();
      expect(err?.errors.role).toBeDefined();
      expect(err?.errors.role.message).toContain('is not a valid user role');
    });

    it('should fail validation on invalid verificationStatus enum', async () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hash123',
        verificationStatus: 'unknown' as any,
      });
      const err = user.validateSync();
      expect(err?.errors.verificationStatus).toBeDefined();
      expect(err?.errors.verificationStatus.message).toContain('is not a valid verification status');
    });

    it('should pass validation with valid user data and defaults', async () => {
      const user = new User({
        name: 'John Investor',
        email: 'john@investor.com',
        passwordHash: 'hash_secret_123',
        role: 'investor',
        investorProfile: {
          interests: ['FinTech', 'AI'],
          ticketMin: 25000,
          ticketMax: 100000,
          pastInvestments: ['Company A', 'Company B'],
        },
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.isEmailVerified).toBe(false);
      expect(user.isSuspended).toBe(false);
      expect(user.verificationStatus).toBe('pending');
      expect(user.investorProfile?.interests).toHaveLength(2);
    });

    it('should define a unique index on email', () => {
      const emailPath = User.schema.path('email') as any;
      const indexes = User.schema.indexes();
      const isUniqueInPath = emailPath?.options?.unique === true;
      const isUniqueInIndexes = indexes.some(([idx, opts]) => idx.email === 1 && opts?.unique === true);
      expect(isUniqueInPath || isUniqueInIndexes).toBe(true);
    });
  });

  describe('Startup Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const startup = new Startup({});
      const err = startup.validateSync();
      expect(err?.errors.founderId).toBeDefined();
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.industry).toBeDefined();
      expect(err?.errors.stage).toBeDefined();
    });

    it('should fail validation on invalid stage enum', async () => {
      const startup = new Startup({
        founderId: new Types.ObjectId(),
        name: 'Acme AI',
        industry: 'Artificial Intelligence',
        stage: 'pre-seed' as any,
      });
      const err = startup.validateSync();
      expect(err?.errors.stage).toBeDefined();
      expect(err?.errors.stage.message).toContain('is not a valid startup stage');
    });

    it('should fail validation on invalid status enum', async () => {
      const startup = new Startup({
        founderId: new Types.ObjectId(),
        name: 'Acme AI',
        industry: 'AI',
        stage: 'seed',
        status: 'archived' as any,
      });
      const err = startup.validateSync();
      expect(err?.errors.status).toBeDefined();
      expect(err?.errors.status.message).toContain('is not a valid startup status');
    });

    it('should fail validation on embedded team member missing name or role', async () => {
      const startup = new Startup({
        founderId: new Types.ObjectId(),
        name: 'Acme AI',
        industry: 'AI',
        stage: 'mvp',
        team: [{ avatarUrl: 'http://example.com/pic.png' } as any],
      });
      const err = startup.validateSync();
      expect(err?.errors['team.0.name']).toBeDefined();
      expect(err?.errors['team.0.role']).toBeDefined();
    });

    it('should pass validation with valid startup data and default status', async () => {
      const startup = new Startup({
        founderId: new Types.ObjectId(),
        name: 'NextGen Robotics',
        tagline: 'Autonomous logistics',
        industry: 'Robotics',
        stage: 'seed',
        fundingAsk: 500000,
        equityOffered: 10,
        team: [
          {
            name: 'Sarah Connor',
            role: 'CEO & Founder',
            linkedinUrl: 'https://linkedin.com/in/sarah',
          },
        ],
      });
      const err = startup.validateSync();
      expect(err).toBeUndefined();
      expect(startup.status).toBe('draft');
      expect(startup.viewsCount).toBe(0);
      expect(startup.team).toHaveLength(1);
    });

    it('should define compound index on (industry, stage, status)', () => {
      const indexes = Startup.schema.indexes();
      const compoundIndex = indexes.find(
        ([idx]) => idx.industry === 1 && idx.stage === 1 && idx.status === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Document Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const doc = new DocumentModel({});
      const err = doc.validateSync();
      expect(err?.errors.startupId).toBeDefined();
      expect(err?.errors.type).toBeDefined();
      expect(err?.errors.title).toBeDefined();
      expect(err?.errors.fileUrl).toBeDefined();
    });

    it('should fail validation on invalid document type enum', async () => {
      const doc = new DocumentModel({
        startupId: new Types.ObjectId(),
        type: 'contract' as any,
        title: 'Pitch Deck 2026',
        fileUrl: 'https://r2.storage.com/deck.pdf',
      });
      const err = doc.validateSync();
      expect(err?.errors.type).toBeDefined();
      expect(err?.errors.type.message).toContain('is not a valid document type');
    });

    it('should fail validation on invalid accessLevel enum', async () => {
      const doc = new DocumentModel({
        startupId: new Types.ObjectId(),
        type: 'pitchdeck',
        title: 'Pitch Deck 2026',
        fileUrl: 'https://r2.storage.com/deck.pdf',
        accessLevel: 'private' as any,
      });
      const err = doc.validateSync();
      expect(err?.errors.accessLevel).toBeDefined();
      expect(err?.errors.accessLevel.message).toContain('is not a valid access level');
    });

    it('should pass validation with valid document data and default accessLevel', async () => {
      const doc = new DocumentModel({
        startupId: new Types.ObjectId(),
        type: 'pitchdeck',
        title: 'Series A Pitch Deck',
        fileUrl: 'https://r2.storage.com/series-a.pdf',
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.accessLevel).toBe('locked');
      expect(doc.uploadedAt).toBeDefined();
    });
  });

  describe('AccessRequest Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const req = new AccessRequest({});
      const err = req.validateSync();
      expect(err?.errors.investorId).toBeDefined();
      expect(err?.errors.documentId).toBeDefined();
      expect(err?.errors.startupId).toBeDefined();
    });

    it('should fail validation on invalid status enum', async () => {
      const req = new AccessRequest({
        investorId: new Types.ObjectId(),
        documentId: new Types.ObjectId(),
        startupId: new Types.ObjectId(),
        status: 'revoked' as any,
      });
      const err = req.validateSync();
      expect(err?.errors.status).toBeDefined();
      expect(err?.errors.status.message).toContain('is not a valid access request status');
    });

    it('should pass validation with default status pending', async () => {
      const req = new AccessRequest({
        investorId: new Types.ObjectId(),
        documentId: new Types.ObjectId(),
        startupId: new Types.ObjectId(),
      });
      const err = req.validateSync();
      expect(err).toBeUndefined();
      expect(req.status).toBe('pending');
    });

    it('should define a unique compound index on (investorId, documentId)', () => {
      const indexes = AccessRequest.schema.indexes();
      const uniqueIndex = indexes.find(
        ([idx, opts]) => idx.investorId === 1 && idx.documentId === 1 && opts?.unique === true
      );
      expect(uniqueIndex).toBeDefined();
    });
  });

  describe('Connection Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const conn = new Connection({});
      const err = conn.validateSync();
      expect(err?.errors.founderId).toBeDefined();
      expect(err?.errors.investorId).toBeDefined();
      expect(err?.errors.startupId).toBeDefined();
    });

    it('should fail validation on invalid status enum', async () => {
      const conn = new Connection({
        founderId: new Types.ObjectId(),
        investorId: new Types.ObjectId(),
        startupId: new Types.ObjectId(),
        status: 'disconnected' as any,
      });
      const err = conn.validateSync();
      expect(err?.errors.status).toBeDefined();
      expect(err?.errors.status.message).toContain('is not a valid connection status');
    });

    it('should pass validation with default status pending', async () => {
      const conn = new Connection({
        founderId: new Types.ObjectId(),
        investorId: new Types.ObjectId(),
        startupId: new Types.ObjectId(),
      });
      const err = conn.validateSync();
      expect(err).toBeUndefined();
      expect(conn.status).toBe('pending');
    });

    it('should define compound index on connections(founderId, investorId)', () => {
      const indexes = Connection.schema.indexes();
      const compoundIndex = indexes.find(
        ([idx]) => idx.founderId === 1 && idx.investorId === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Message Model', () => {
    it('should fail validation when connectionId or senderId is missing', async () => {
      const msg = new Message({});
      const err = msg.validateSync();
      expect(err?.errors.connectionId).toBeDefined();
      expect(err?.errors.senderId).toBeDefined();
    });

    it('should pass validation with valid message and default readAt', async () => {
      const msg = new Message({
        connectionId: new Types.ObjectId(),
        senderId: new Types.ObjectId(),
        text: 'Hello, thrilled to connect!',
        attachmentUrl: 'https://r2.storage.com/onepager.pdf',
      });
      const err = msg.validateSync();
      expect(err).toBeUndefined();
      expect(msg.readAt).toBeNull();
    });

    it('should define compound index on messages(connectionId, createdAt)', () => {
      const indexes = Message.schema.indexes();
      const compoundIndex = indexes.find(
        ([idx]) => idx.connectionId === 1 && idx.createdAt === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Meeting Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const meeting = new Meeting({});
      const err = meeting.validateSync();
      expect(err?.errors.connectionId).toBeDefined();
      expect(err?.errors.title).toBeDefined();
      expect(err?.errors.scheduledAt).toBeDefined();
      expect(err?.errors.roomName).toBeDefined();
      expect(err?.errors.createdBy).toBeDefined();
    });

    it('should fail validation on invalid status enum', async () => {
      const meeting = new Meeting({
        connectionId: new Types.ObjectId(),
        title: 'Pitch Review Call',
        scheduledAt: new Date(),
        roomName: 'founderlink-room-123',
        createdBy: new Types.ObjectId(),
        status: 'postponed' as any,
      });
      const err = meeting.validateSync();
      expect(err?.errors.status).toBeDefined();
      expect(err?.errors.status.message).toContain('is not a valid meeting status');
    });

    it('should pass validation with default status scheduled', async () => {
      const meeting = new Meeting({
        connectionId: new Types.ObjectId(),
        title: 'Introduction Call',
        scheduledAt: new Date(Date.now() + 86400000),
        roomName: 'founderlink-intro-456',
        createdBy: new Types.ObjectId(),
      });
      const err = meeting.validateSync();
      expect(err).toBeUndefined();
      expect(meeting.status).toBe('scheduled');
    });
  });

  describe('Metric Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const metric = new Metric({});
      const err = metric.validateSync();
      expect(err?.errors.startupId).toBeDefined();
      expect(err?.errors.month).toBeDefined();
      expect(err?.errors.createdBy).toBeDefined();
    });

    it('should fail validation on invalid month format', async () => {
      const metric = new Metric({
        startupId: new Types.ObjectId(),
        month: 'Nov-2026',
        createdBy: new Types.ObjectId(),
      });
      const err = metric.validateSync();
      expect(err?.errors.month).toBeDefined();
      expect(err?.errors.month.message).toContain('Month must be in YYYY-MM format');
    });

    it('should fail validation on negative numeric values', async () => {
      const metric = new Metric({
        startupId: new Types.ObjectId(),
        month: '2026-11',
        revenue: -500,
        activeUsers: -10,
        fundsUsed: -1000,
        createdBy: new Types.ObjectId(),
      });
      const err = metric.validateSync();
      expect(err?.errors.revenue).toBeDefined();
      expect(err?.errors.activeUsers).toBeDefined();
      expect(err?.errors.fundsUsed).toBeDefined();
    });

    it('should pass validation with valid metrics and defaults', async () => {
      const metric = new Metric({
        startupId: new Types.ObjectId(),
        month: '2026-11',
        revenue: 25000,
        activeUsers: 3400,
        fundsUsed: 12000,
        milestone: 'Launched Beta',
        notes: '35% MoM user growth',
        createdBy: new Types.ObjectId(),
      });
      const err = metric.validateSync();
      expect(err).toBeUndefined();
      expect(metric.revenue).toBe(25000);
      expect(metric.activeUsers).toBe(3400);
    });

    it('should define compound unique index on (startupId, month)', () => {
      const indexes = Metric.schema.indexes();
      const uniqueIndex = indexes.find(
        ([idx, opts]) => idx.startupId === 1 && idx.month === 1 && opts?.unique === true
      );
      expect(uniqueIndex).toBeDefined();
    });
  });

  describe('Notification Model', () => {
    it('should fail validation when required fields are missing', async () => {
      const notif = new Notification({});
      const err = notif.validateSync();
      expect(err?.errors.userId).toBeDefined();
      expect(err?.errors.type).toBeDefined();
      expect(err?.errors.message).toBeDefined();
    });

    it('should pass validation with default isRead false', async () => {
      const notif = new Notification({
        userId: new Types.ObjectId(),
        type: 'connection_request',
        message: 'Alice requested to connect with your startup.',
        link: '/connections/pending',
      });
      const err = notif.validateSync();
      expect(err).toBeUndefined();
      expect(notif.isRead).toBe(false);
    });
  });

  describe('AuditLog Model', () => {
    it('should fail validation when action or targetType is missing', async () => {
      const log = new AuditLog({});
      const err = log.validateSync();
      expect(err?.errors.action).toBeDefined();
      expect(err?.errors.targetType).toBeDefined();
    });

    it('should pass validation with valid audit log data', async () => {
      const log = new AuditLog({
        userId: new Types.ObjectId(),
        action: 'DOCUMENT_ACCESSED',
        targetType: 'Document',
        targetId: new Types.ObjectId(),
        ip: '192.168.1.1',
      });
      const err = log.validateSync();
      expect(err).toBeUndefined();
      expect(log.action).toBe('DOCUMENT_ACCESSED');
    });
  });

  describe('Database Unique Constraint (Live DB)', () => {
    const testDbUri = 'mongodb://127.0.0.1:27017/founderlink_test_models';
    let dbConnected = false;

    beforeAll(async () => {
      try {
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 2000 });
        }
        dbConnected = mongoose.connection.readyState === 1;
        if (dbConnected) {
          await User.init(); // Ensure indexes are built in MongoDB
        }
      } catch {
        dbConnected = false;
      }
    });

    afterAll(async () => {
      if (dbConnected) {
        try {
          await User.deleteMany({ email: /@test-unique\.com$/ });
          await mongoose.disconnect();
        } catch {
          // ignore
        }
      }
    });

    it('should enforce unique email constraint at database level when DB is available', async () => {
      if (!dbConnected) {
        console.warn('Skipping live DB unique constraint test: DB not reachable');
        return;
      }

      const email = `test-${Date.now()}@test-unique.com`;
      await User.create({
        name: 'First User',
        email,
        passwordHash: 'hash1',
        role: 'founder',
      });

      // Attempting to create duplicate user with same email
      let duplicateError: any = null;
      try {
        await User.create({
          name: 'Second User',
          email,
          passwordHash: 'hash2',
          role: 'investor',
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).toBeDefined();
      expect(duplicateError.code).toBe(11000); // MongoDB duplicate key error code
    });
  });
});
