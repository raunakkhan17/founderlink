import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { AccessRequest } from '../models/accessRequest.model';
import { DocumentModel } from '../models/document.model';
import { Startup } from '../models/startup.model';

export class AccessRequestController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId } = req.body;
      if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        res.status(400).json({ success: false, message: 'Valid documentId is required' });
        return;
      }
      const doc = await DocumentModel.findById(documentId);
      const startup = doc ? await Startup.findById(doc.startupId) : null;
      if (!doc || !startup || startup.status !== 'approved') {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }
      if (doc.accessLevel === 'public') {
        res.status(400).json({ success: false, message: 'This document is public. No request needed.' });
        return;
      }
      try {
        const request = await AccessRequest.create({
          investorId: req.user!._id,
          documentId: doc._id,
          startupId: doc.startupId,
          status: 'pending',
        });
        res.status(201).json({
          success: true,
          message: 'Access request sent',
          data: { request, accessRequest: request },
        });
      } catch (err: any) {
        if (err.code === 11000) {
          res.status(409).json({ success: false, message: 'You have already requested access to this document' });
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await AccessRequest.find({ investorId: req.user!._id })
        .sort({ createdAt: -1 })
        .populate('documentId', 'title type accessLevel')
        .populate('startupId', 'name');
      res.status(200).json({ success: true, data: { requests } });
    } catch (error) {
      next(error);
    }
  }
}
