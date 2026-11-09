import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import { StorageService } from '../services/storage.service';

export class UserController {
  static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!._id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, headline, bio, location, avatarUrl, investorProfile } = req.body;

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name.trim();
      if (headline !== undefined) updateData.headline = headline.trim();
      if (bio !== undefined) updateData.bio = bio.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();
      if (investorProfile !== undefined && req.user!.role === 'investor') {
        updateData.investorProfile = investorProfile;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No avatar image file provided',
        });
        return;
      }

      const { fileUrl } = await StorageService.uploadFile(req.file, 'avatars');

      const updatedUser = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: { avatarUrl: fileUrl } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: fileUrl,
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

