import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User, IUser } from '../models/user.model';
import { Startup, IStartup } from '../models/startup.model';
import { Connection } from '../models/connection.model';
import { Meeting } from '../models/meeting.model';
import { AuditLog } from '../models/auditLog.model';
import { Notification } from '../models/notification.model';
import { DocumentModel } from '../models/document.model';
import { StorageService } from '../services/storage.service';
import mongoose from 'mongoose';

export class AdminController {
  // 1. Get platform stats
  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        foundersCount,
        investorsCount,
        adminsCount,
        pendingUsersCount,
        totalStartups,
        pendingStartupsCount,
        approvedStartupsCount,
        rejectedStartupsCount,
        totalConnections,
        activeMeetings,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'founder' }),
        User.countDocuments({ role: 'investor' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ verificationStatus: 'pending' }),
        Startup.countDocuments(),
        Startup.countDocuments({ status: 'pending' }),
        Startup.countDocuments({ status: 'approved' }),
        Startup.countDocuments({ status: 'rejected' }),
        Connection.countDocuments(),
        Meeting.countDocuments({ status: { $in: ['scheduled', 'rescheduled'] } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            founders: foundersCount,
            investors: investorsCount,
            admins: adminsCount,
            pending: pendingUsersCount,
          },
          startups: {
            total: totalStartups,
            pending: pendingStartupsCount,
            approved: approvedStartupsCount,
            rejected: rejectedStartupsCount,
          },
          connections: {
            total: totalConnections,
          },
          meetings: {
            active: activeMeetings,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Pending queue: Users & Startups
  static async getPendingUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find({ verificationStatus: 'pending' })
        .select('-passwordHash')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.verificationStatus = status;
      await user.save();

      // Create Notification for the user
      const message = status === 'approved'
        ? 'Congratulations! Your FounderLink account has been approved by admin.'
        : `Your FounderLink account verification was rejected.${reason ? ` Reason: ${reason}` : ''}`;

      await Notification.create({
        userId: user._id,
        type: 'system',
        message,
        link: '/login',
      });

      // Audit Log
      await AuditLog.create({
        userId: req.user!._id,
        action: `user_verification_${status}`,
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: `User ${status} successfully`,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verificationStatus: user.verificationStatus,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingStartups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startups = await Startup.find({ status: 'pending' })
        .populate('founderId', 'name email avatarUrl headline')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { startups },
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid startup ID' });
        return;
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
        return;
      }

      const startup = await Startup.findById(id);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Startup not found' });
        return;
      }

      startup.status = status;
      await startup.save();

      // Notify the founder
      const message = status === 'approved'
        ? `Your startup "${startup.name}" has been approved and is now live on FounderLink!`
        : `Your startup "${startup.name}" submission was rejected.${reason ? ` Reason: ${reason}` : ''}`;

      await Notification.create({
        userId: startup.founderId,
        type: 'system',
        message,
        link: `/dashboard/founder`,
      });

      // Audit Log
      await AuditLog.create({
        userId: req.user!._id,
        action: `startup_${status}`,
        targetType: 'startup',
        targetId: startup._id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: `Startup ${status} successfully`,
        data: { startup },
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. User management: List, suspend, reactivate
  static async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, status, page, limit } = req.query;

      const query: Record<string, any> = {};

      if (role && role !== 'all') {
        query.role = role;
      }

      if (status && status !== 'all') {
        if (status === 'suspended') {
          query.isSuspended = true;
        } else if (status === 'active') {
          query.isSuspended = false;
        } else {
          query.verificationStatus = status;
        }
      }

      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ name: searchRegex }, { email: searchRegex }, { headline: searchRegex }];
      }

      const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limit || '20'), 10)));
      const skip = (pageNum - 1) * limitNum;

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.status(200).json({
        success: true,
        data: {
          users,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleSuspendUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isSuspended } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
      }

      if (typeof isSuspended !== 'boolean') {
        res.status(400).json({ success: false, message: 'isSuspended boolean is required' });
        return;
      }

      // Cannot suspend self
      if (req.user!._id.toString() === id) {
        res.status(400).json({ success: false, message: 'Admin cannot suspend own account' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.isSuspended = isSuspended;
      await user.save();

      // Audit Log
      await AuditLog.create({
        userId: req.user!._id,
        action: isSuspended ? 'user_suspended' : 'user_reactivated',
        targetType: 'user',
        targetId: user._id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: `User ${isSuspended ? 'suspended' : 'reactivated'} successfully`,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            isSuspended: user.isSuspended,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete reported / objectionable content (e.g., document or startup)
  static async deleteContent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        res.status(400).json({ success: false, message: 'Invalid content ID' });
        return;
      }

      if (type === 'startup') {
        const startup = await Startup.findById(id);
        if (!startup) {
          res.status(404).json({ success: false, message: 'Startup not found' });
          return;
        }

        const docs = await DocumentModel.find({ startupId: startup._id });
        for (const doc of docs) {
          await StorageService.deleteFile(doc.fileUrl);
        }
        await DocumentModel.deleteMany({ startupId: startup._id });
        await Startup.findByIdAndDelete(id);

        await AuditLog.create({
          userId: req.user!._id,
          action: 'admin_delete_startup',
          targetType: 'startup',
          targetId: new mongoose.Types.ObjectId(id as string),
          ip: req.ip,
        });

        res.status(200).json({
          success: true,
          message: 'Startup and associated documents deleted successfully by admin',
        });
        return;
      } else if (type === 'document') {
        const doc = await DocumentModel.findById(id);
        if (!doc) {
          res.status(404).json({ success: false, message: 'Document not found' });
          return;
        }

        await StorageService.deleteFile(doc.fileUrl);
        await DocumentModel.findByIdAndDelete(id);

        await AuditLog.create({
          userId: req.user!._id,
          action: 'admin_delete_document',
          targetType: 'document',
          targetId: new mongoose.Types.ObjectId(id as string),
          ip: req.ip,
        });

        res.status(200).json({
          success: true,
          message: 'Document deleted successfully by admin',
        });
        return;
      } else {
        res.status(400).json({ success: false, message: 'Content type must be startup or document' });
      }
    } catch (error) {
      next(error);
    }
  }

  // 5. View Audit Logs with filters
  static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, action, startDate, endDate, page, limit } = req.query;

      const query: Record<string, any> = {};

      if (user && mongoose.Types.ObjectId.isValid(String(user))) {
        query.userId = new mongoose.Types.ObjectId(String(user));
      }

      if (action && action !== 'all') {
        query.action = String(action);
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(String(startDate));
        }
        if (endDate) {
          const end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limit || '50'), 10)));
      const skip = (pageNum - 1) * limitNum;

      const total = await AuditLog.countDocuments(query);
      const auditLogs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.status(200).json({
        success: true,
        data: {
          auditLogs,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

