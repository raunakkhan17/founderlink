import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel } from '../models/document.model';
import { Startup } from '../models/startup.model';
import { AccessRequest } from '../models/accessRequest.model';
import { Connection } from '../models/connection.model';
import { AuditLog } from '../models/auditLog.model';

export class FileAccessController {
  // Returns a 5-minute signed link if the user is allowed to open the document
  static async open(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid document ID' });
        return;
      }
      const doc = await DocumentModel.findById(id);
      const startup = doc ? await Startup.findById(doc.startupId) : null;
      if (!doc || !startup) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const user = req.user!;
      const isOwner = startup.founderId.toString() === user._id.toString();
      const isAdmin = user.role === 'admin';
      let allowed = isOwner || isAdmin;

      if (!allowed) {
        if (startup.status !== 'approved') {
          res.status(404).json({ success: false, message: 'Document not found' });
          return;
        }
        if (doc.accessLevel === 'public') {
          allowed = true;
        } else {
          const approved = await AccessRequest.exists({ investorId: user._id, documentId: doc._id, status: 'approved' });
          if (approved) {
            allowed = true;
          } else if (doc.accessLevel === 'approved_only') {
            const connected = await Connection.exists({ investorId: user._id, startupId: startup._id, status: 'accepted' });
            if (connected) allowed = true;
          }
        }
      }

      if (!allowed) {
        res.status(403).json({ success: false, message: 'Access denied. Please request access first.' });
        return;
      }

      const token = jwt.sign(
        { docId: doc._id.toString(), userId: user._id.toString(), purpose: 'file' },
        process.env.JWT_SECRET as string,
        { expiresIn: '5m' }
      );

      await AuditLog.create({
        userId: user._id,
        action: 'document_open',
        targetType: 'document',
        targetId: doc._id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        data: {
          url: `${req.protocol}://${req.get('host')}/api/files/download/${token}`,
          expiresInSeconds: 300,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Serves the file only if the signed link is still valid
  static async download(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let payload: any;
      try {
        payload = jwt.verify(req.params.token as string, process.env.JWT_SECRET as string);
      } catch {
        res.status(401).json({ success: false, message: 'Link expired or invalid' });
        return;
      }
      if (payload.purpose !== 'file') {
        res.status(401).json({ success: false, message: 'Link expired or invalid' });
        return;
      }
      const doc = await DocumentModel.findById(payload.docId);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }
      const filePath = path.join(process.cwd(), 'uploads', 'documents', path.basename(doc.fileUrl));
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found in storage' });
        return;
      }
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
