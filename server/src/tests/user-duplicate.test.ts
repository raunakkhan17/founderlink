import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { config } from '../config/env';

describe('User Model - Duplicate Email Constraint', () => {
  const testEmail = 'test@example.com';

  beforeAll(async () => {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    // Clean up any existing user with testEmail
    await User.deleteMany({ email: testEmail });

    // Ensure unique index is built before running the test
    await User.syncIndexes();
  });

  afterAll(async () => {
    // Clean up and disconnect
    try {
      await User.deleteMany({ email: testEmail });
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('should fail with duplicate key error code 11000 when creating a second user with test@example.com', async () => {
    // 1. Create first user
    const firstUser = await User.create({
      name: 'First User',
      email: testEmail,
      passwordHash: 'hashed_pw_1',
      role: 'founder',
    });
    expect(firstUser).toBeDefined();
    expect(firstUser.email).toBe(testEmail);

    // 2. Try to create second user with the exact same email
    let duplicateError: any = null;
    try {
      await User.create({
        name: 'Second User',
        email: testEmail,
        passwordHash: 'hashed_pw_2',
        role: 'investor',
      });
    } catch (err) {
      duplicateError = err;
    }

    // 3. Verify duplicate key error
    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });
});

