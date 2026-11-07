import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: 'name, email, password, and role are required',
        });
        return;
      }

      if (role === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin account cannot be self-registered',
        });
        return;
      }

      if (role !== 'founder' && role !== 'investor') {
        res.status(400).json({
          success: false,
          message: 'Role must be either "founder" or "investor"',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
        return;
      }

      const { user, verificationToken } = await AuthService.register({
        name,
        email,
        password,
        role,
      });

      const verificationLink = `${config.CLIENT_URL}/verify-email?token=${verificationToken}`;

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          user,
          verificationToken,
          verificationLink,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const { user, tokens } = await AuthService.login(email, password);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Refresh token is required in cookie or body',
        });
        return;
      }

      const tokens = await AuthService.refresh(token);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = (req.query.token as string) || req.body?.token;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      const user = await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Your account is now pending admin approval.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const { resetToken } = await AuthService.forgotPassword(email);
      const resetLink = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been dispatched.',
        data: {
          resetToken,
          resetLink,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token and newPassword are required',
        });
        return;
      }

      const user = await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}

