import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Connection } from '../models/connection.model';
import { Startup } from '../models/startup.model';
import mongoose from 'mongoose';

export class ConnectionController {
  static async createConnection(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startupId, message } = req.body;

      if (!startupId || !mongoose.Types.ObjectId.isValid(startupId)) {
        res.status(400).json({ success: false, message: 'Invalid or missing startup ID' });
        return;
      }

      const startup = await Startup.findById(startupId);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Startup not found' });
        return;
      }

      const founderId = startup.founderId;
      if (founderId.toString() === req.user!._id.toString()) {
        res.status(400).json({ success: false, message: 'Cannot send a connection request to your own startup' });
        return;
      }

      // Check existing connection
      const existing = await Connection.findOne({
        founderId,
        investorId: req.user!._id,
        startupId: startup._id,
      });

      if (existing) {
        if (existing.status === 'pending' || existing.status === 'accepted') {
          res.status(409).json({
            success: false,
            message: `A connection request already exists with status: ${existing.status}`,
            data: { connection: existing },
          });
          return;
        }

        // If declined, update status back to pending
        existing.status = 'pending';
        if (message) (existing as any).message = message;
        await existing.save();

        res.status(200).json({
          success: true,
          message: 'Connection request resent',
          data: { connection: existing },
        });
        return;
      }

      const connection = await Connection.create({
        founderId,
        investorId: req.user!._id,
        startupId: startup._id,
        status: 'pending',
        message: message?.trim() || undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Connection request sent successfully',
        data: { connection },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyConnections(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const connections = await Connection.find({ investorId: req.user!._id })
        .populate('founderId', 'name email avatarUrl headline')
        .populate('startupId', 'name tagline stage industry')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { connections },
      });
    } catch (error) {
      next(error);
    }
  }
}

