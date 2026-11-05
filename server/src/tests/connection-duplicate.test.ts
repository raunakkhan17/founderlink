import mongoose, { Types } from 'mongoose';
import { Connection } from '../models/connection.model';
import { config } from '../config/env';

describe('Connection Model - Duplicate Compound Unique Index', () => {
  const dummyFounderId = new Types.ObjectId();
  const dummyInvestorId = new Types.ObjectId();
  const dummyStartupId = new Types.ObjectId();

  beforeAll(async () => {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    // Clean up any matching connection
    await Connection.deleteMany({
      founderId: dummyFounderId,
      investorId: dummyInvestorId,
      startupId: dummyStartupId,
    });

    // Ensure indexes are built before test runs
    await Connection.init();
  });

  afterAll(async () => {
    try {
      await Connection.deleteMany({
        founderId: dummyFounderId,
        investorId: dummyInvestorId,
        startupId: dummyStartupId,
      });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('should fail with duplicate key error code 11000 when creating a duplicate connection with same (founderId, investorId, startupId)', async () => {
    // 1. Create first connection
    const firstConn = await Connection.create({
      founderId: dummyFounderId,
      investorId: dummyInvestorId,
      startupId: dummyStartupId,
      status: 'pending',
    });
    expect(firstConn).toBeDefined();

    // 2. Try to create second connection with the exact same three values
    let duplicateError: any = null;
    try {
      await Connection.create({
        founderId: dummyFounderId,
        investorId: dummyInvestorId,
        startupId: dummyStartupId,
        status: 'pending',
      });
    } catch (err) {
      duplicateError = err;
    }

    // 3. Verify duplicate key error code 11000
    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });
});

