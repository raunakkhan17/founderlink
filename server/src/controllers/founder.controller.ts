import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Startup } from '../models/startup.model';
import { AccessRequest, AccessRequestStatus } from '../models/accessRequest.model';
import { Connection, ConnectionStatus } from '../models/connection.model';
import { User } from '../models/user.model';
import mongoose from 'mongoose';

export class FounderController {
  static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const founderId = req.user!._id;

      // 1. Profile views
      const user = await User.findById(founderId);
      const profileViews = user?.profileViewsCount || 0;

      // 2. Startups owned by founder
      const myStartups = await Startup.find({ founderId });
      const myStartupIds = myStartups.map((s) => s._id);

      // Sum of startup views
      const startupViews = myStartups.reduce((sum, s) => sum + (s.viewsCount || 0), 0);

      // 3. Access Requests for founder's startups
      const totalAccessRequests = await AccessRequest.countDocuments({ startupId: { $in: myStartupIds } });
      const pendingAccessRequests = await AccessRequest.countDocuments({
        startupId: { $in: myStartupIds },
        status: 'pending',
      });

      // 4. Connection Requests for founder
      const totalConnectionRequests = await Connection.countDocuments({ founderId });
      const pendingConnectionRequests = await Connection.countDocuments({
        founderId,
        status: 'pending',
      });

      // 5. Recent activity
      const recentAccess = await AccessRequest.find({ startupId: { $in: myStartupIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('investorId', 'name email avatarUrl headline')
        .populate('documentId', 'title type')
        .populate('startupId', 'name');

      const recentConnections = await Connection.find({ founderId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('investorId', 'name email avatarUrl headline')
        .populate('startupId', 'name');

      res.status(200).json({
        success: true,
        data: {
          stats: {
            profileViews,
            startupViews,
            startupsCount: myStartups.length,
            accessRequests: {
              pending: pendingAccessRequests,
              total: totalAccessRequests,
            },
            connectionRequests: {
              pending: pendingConnectionRequests,
              total: totalConnectionRequests,
            },
          },
          recentActivity: {
            accessRequests: recentAccess,
            connections: recentConnections,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAccessRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const founderId = req.user!._id;
      const myStartups = await Startup.find({ founderId }).select('_id');
      const myStartupIds = myStartups.map((s) => s._id);

      const requests = await AccessRequest.find({ startupId: { $in: myStartupIds } })
        .sort({ createdAt: -1 })
        .populate('investorId', 'name email avatarUrl headline')
        .populate('documentId', 'title type fileUrl accessLevel')
        .populate('startupId', 'name industry');

      res.status(200).json({
        success: true,
        data: { accessRequests: requests },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAccessRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid access request ID' });
        return;
      }

      const validStatuses: AccessRequestStatus[] = ['approved', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either "approved" or "rejected"',
        });
        return;
      }

      const accessRequest = await AccessRequest.findById(id);
      if (!accessRequest) {
        res.status(404).json({ success: false, message: 'Access request not found' });
        return;
      }

      // Verify that the startup belongs to this founder
      const startup = await Startup.findById(accessRequest.startupId);
      if (!startup || startup.founderId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not own the startup associated with this access request.',
        });
        return;
      }

      accessRequest.status = status;
      await accessRequest.save();

      res.status(200).json({
        success: true,
        message: `Access request ${status} successfully`,
        data: { accessRequest },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getConnectionRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const founderId = req.user!._id;

      const connections = await Connection.find({ founderId })
        .sort({ createdAt: -1 })
        .populate('investorId', 'name email avatarUrl headline investorProfile')
        .populate('startupId', 'name industry');

      res.status(200).json({
        success: true,
        data: { connections },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateConnectionRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid connection request ID' });
        return;
      }

      const validStatuses: ConnectionStatus[] = ['accepted', 'declined', 'blocked'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be one of: "accepted", "declined", "blocked"',
        });
        return;
      }

      const connection = await Connection.findById(id);
      if (!connection) {
        res.status(404).json({ success: false, message: 'Connection request not found' });
        return;
      }

      if (connection.founderId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not the founder on this connection request.',
        });
        return;
      }

      connection.status = status;
      await connection.save();

      res.status(200).json({
        success: true,
        message: `Connection request ${status} successfully`,
        data: { connection },
      });
    } catch (error) {
      next(error);
    }
  }
}
