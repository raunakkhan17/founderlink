import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel, AccessLevel } from '../models/document.model';
import { Startup } from '../models/startup.model';
import { AccessRequest } from '../models/accessRequest.model';
import { Connection } from '../models/connection.model';
import { AuditLog } from '../models/auditLog.model';
import { StorageService } from '../services/storage.service';
import mongoose from 'mongoose';

export class DocumentController {
  static async updateAccessLevel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { accessLevel } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid document ID' });
        return;
      }

      const validAccessLevels: AccessLevel[] = ['public', 'locked', 'approved_only'];
      if (!accessLevel || !validAccessLevels.includes(accessLevel)) {
        res.status(400).json({
          success: false,
          message: `Invalid access level. Must be one of: ${validAccessLevels.join(', ')}`,
        });
        return;
      }

      const document = await DocumentModel.findById(id);
      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const startup = await Startup.findById(document.startupId);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Associated startup not found' });
        return;
      }

      // Founder only, own startup only (or admin)
      const isOwner = req.user && startup.founderId.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only modify documents for your own startups.',
        });
        return;
      }

      document.accessLevel = accessLevel;
      await document.save();

      res.status(200).json({
        success: true,
        message: 'Document access level updated successfully',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid document ID' });
        return;
      }

      const document = await DocumentModel.findById(id);
      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const startup = await Startup.findById(document.startupId);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Associated startup not found' });
        return;
      }

      const isOwner = req.user && startup.founderId.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete documents from your own startups.',
        });
        return;
      }

      await StorageService.deleteFile(document.fileUrl);
      await DocumentModel.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid document ID' });
        return;
      }

      const document = await DocumentModel.findById(id);
      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const startup = await Startup.findById(document.startupId);
      if (!startup) {
        res.status(404).json({ success: false, message: 'Associated startup not found' });
        return;
      }

      const isOwner = req.user && startup.founderId.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        if (document.accessLevel === 'locked') {
          const approvedReq = await AccessRequest.findOne({
            investorId: req.user!._id,
            documentId: document._id,
            status: 'approved',
          });

          if (!approvedReq) {
            res.status(403).json({
              success: false,
              message: 'Access denied: document is locked and requires an approved access request.',
            });
            return;
          }
        } else if (document.accessLevel === 'approved_only') {
          const approvedReq = await AccessRequest.findOne({
            investorId: req.user!._id,
            documentId: document._id,
            status: 'approved',
          });

          const acceptedConn = await Connection.findOne({
            investorId: req.user!._id,
            startupId: startup._id,
            status: 'accepted',
          });

          if (!approvedReq && !acceptedConn) {
            res.status(403).json({
              success: false,
              message: 'Access denied: document requires an approved access request or accepted connection.',
            });
            return;
          }
        }
      }

      // Generate 5-minute signed URL
      const signedUrl = StorageService.getSignedUrl(document.fileUrl, 300);

      // Log access in auditLogs
      await AuditLog.create({
        userId: req.user?._id || null,
        action: 'document_view',
        targetType: 'document',
        targetId: document._id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Access granted',
        data: {
          document,
          signedUrl,
          expiresIn: 300,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
