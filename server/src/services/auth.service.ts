import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.util';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role: 'founder' | 'investor';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async register(dto: RegisterDTO): Promise<{ user: IUser; verificationToken: string }> {
    const { name, email, password, role } = dto;

    if (role !== 'founder' && role !== 'investor') {
      throw new Error('Invalid registration role. Only founder and investor roles are allowed.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err: any = new Error('Email is already registered');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isEmailVerified: false,
      verificationStatus: 'pending',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    return { user, verificationToken };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    if (user.isSuspended) {
      const err: any = new Error('Your account has been suspended. Please contact support.');
      err.statusCode = 403;
      throw err;
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      const err: any = new Error(`Account is temporarily locked due to 5 failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
      err.statusCode = 423;
      throw err;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.loginAttempts = 0; // reset counter after locking
      }
      await user.save();

      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { user, tokens: { accessToken, refreshToken } };
  }

  static async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      const err: any = new Error('Refresh token is required');
      err.statusCode = 401;
      throw err;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const err: any = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(payload.userId);
    if (!user || user.isSuspended) {
      const err: any = new Error('User not found or account suspended');
      err.statusCode = 401;
      throw err;
    }

    const newPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async verifyEmail(token: string): Promise<IUser> {
    if (!token) {
      const err: any = new Error('Verification token is required');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      const err: any = new Error('Invalid or expired email verification token');
      err.statusCode = 400;
      throw err;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return user;
  }

  static async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always generate and return consistent response to prevent email enumeration
    const resetToken = crypto.randomBytes(32).toString('hex');

    if (user && !user.isSuspended) {
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
    }

    return { resetToken };
  }

  static async resetPassword(token: string, newPassword: string): Promise<IUser> {
    if (!token) {
      const err: any = new Error('Reset token is required');
      err.statusCode = 400;
      throw err;
    }

    if (!newPassword || newPassword.length < 8) {
      const err: any = new Error('Password must be at least 8 characters long');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      const err: any = new Error('Invalid or expired password reset token');
      err.statusCode = 400;
      throw err;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return user;
  }
}
