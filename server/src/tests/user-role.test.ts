import mongoose from 'mongoose';
import { User, UserRole } from '../models/user.model';
import { config } from '../config/env';

describe('User Model - Role Enum Validation', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }
  });

  afterAll(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

  it('should fail with a Mongoose validation error on the role field when role is "manager"', async () => {
    const user = new User({
      name: 'Manager User',
      email: 'manager@example.com',
      passwordHash: 'hashed_pw_manager',
      role: 'manager' as any,
    });

    const error = user.validateSync();

    expect(error).toBeDefined();
    expect(error?.errors).toBeDefined();
    expect(error?.errors.role).toBeDefined();
    expect(error?.errors.role.name).toBe('ValidatorError');
    expect(error?.errors.role.message).toContain('is not a valid user role');
  });

  it('should accept valid roles: "founder", "investor", and "admin"', () => {
    const validRoles: UserRole[] = ['founder', 'investor', 'admin'];

    for (const role of validRoles) {
      const user = new User({
        name: `Valid ${role}`,
        email: `${role}@example.com`,
        passwordHash: `hashed_pw_${role}`,
        role,
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.role).toBe(role);
    }
  });
});

