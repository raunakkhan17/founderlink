import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password.util';
import { config } from '../config/env';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = config.ADMIN_EMAIL.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed] Admin already exists with email: ${adminEmail}`);
      return;
    }

    const passwordHash = await hashPassword(config.ADMIN_PASSWORD);

    await User.create({
      name: config.ADMIN_NAME,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      verificationStatus: 'approved',
      headline: 'Platform Super Administrator',
    });

    console.log(`[Seed] Initial admin user successfully created: ${adminEmail}`);
  } catch (error) {
    console.error('[Seed] Error seeding admin account:', error);
  }
};

// If run directly from CLI
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(config.MONGO_URI);
      console.log('[Seed] Connected to MongoDB for seeding');
      await seedAdmin();
      await mongoose.disconnect();
      console.log('[Seed] Seeding completed successfully');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Seed script failed:', err);
      process.exit(1);
    }
  })();
}

