import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User, IInvestorProfile } from '../models/user.model';
import { AccessRequest } from '../models/accessRequest.model';
import { Connection } from '../models/connection.model';
import { Startup } from '../models/startup.model';
import mongoose from 'mongoose';

export class InvestorController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            headline: user.headline,
            bio: user.bio,
            location: user.location,
            investorProfile: user.investorProfile || {
              interests: [],
              ticketMin: undefined,
              ticketMax: undefined,
              pastInvestments: [],
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        headline,
        bio,
        location,
        avatarUrl,
        interests,
        ticketMin,
        ticketMax,
        pastInvestments,
      } = req.body;

      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (name !== undefined) user.name = name.trim();
      if (headline !== undefined) user.headline = headline?.trim();
      if (bio !== undefined) user.bio = bio?.trim();
      if (location !== undefined) user.location = location?.trim();
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

      // Update investorProfile
      const currentProfile: IInvestorProfile = user.investorProfile || {
        interests: [],
        ticketMin: undefined,
        ticketMax: undefined,
        pastInvestments: [],
      };

      if (interests !== undefined) {
        currentProfile.interests = Array.isArray(interests) ? interests.map((i: string) => String(i).trim()) : [];
      }
      if (ticketMin !== undefined) {
        currentProfile.ticketMin = ticketMin !== null && ticketMin !== '' ? Number(ticketMin) : undefined;
      }
      if (ticketMax !== undefined) {
        currentProfile.ticketMax = ticketMax !== null && ticketMax !== '' ? Number(ticketMax) : undefined;
      }
      if (pastInvestments !== undefined) {
        currentProfile.pastInvestments = Array.isArray(pastInvestments)
          ? pastInvestments.map((p: string) => String(p).trim())
          : [];
      }

      user.investorProfile = currentProfile;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Investor profile updated successfully',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            headline: user.headline,
            bio: user.bio,
            location: user.location,
            investorProfile: user.investorProfile,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWatchlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!._id).populate({
        path: 'savedStartups',
        populate: { path: 'founderId', select: 'name email avatarUrl headline' },
      });

      res.status(200).json({
        success: true,
        data: {
          savedStartups: user?.savedStartups || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid startup ID' });
        return;
      }

      const startup = await Startup.findById(id);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Startup not found' });
        return;
      }

      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.savedStartups) {
        user.savedStartups = [];
      }

      const objId = new mongoose.Types.ObjectId(id);
      if (!user.savedStartups.some((sid) => sid.toString() === id)) {
        user.savedStartups.push(objId);
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Startup saved to watchlist',
        data: { savedStartups: user.savedStartups },
      });
    } catch (error) {
      next(error);
    }
  }

  static async unsaveStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid startup ID' });
        return;
      }

      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.savedStartups) {
        user.savedStartups = user.savedStartups.filter((sid) => sid.toString() !== id);
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Startup removed from watchlist',
        data: { savedStartups: user.savedStartups || [] },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [accessRequests, connections] = await Promise.all([
        AccessRequest.find({ investorId: req.user!._id })
          .populate('documentId', 'title type accessLevel')
          .populate('startupId', 'name tagline stage industry')
          .sort({ createdAt: -1 }),
        Connection.find({ investorId: req.user!._id })
          .populate('founderId', 'name email avatarUrl headline')
          .populate('startupId', 'name tagline stage industry')
          .sort({ createdAt: -1 }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          accessRequests,
          connections,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

