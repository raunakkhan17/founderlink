import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Startup } from '../models/startup.model';
import { DocumentModel, DocumentType, AccessLevel } from '../models/document.model';
import { StorageService } from '../services/storage.service';
import mongoose from 'mongoose';

export class StartupController {
  static async createStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        tagline,
        problem,
        solution,
        market,
        industry,
        stage,
        fundingAsk,
        equityOffered,
        team,
      } = req.body;

      if (!name || !industry || !stage) {
        res.status(400).json({
          success: false,
          message: 'name, industry, and stage are required',
        });
        return;
      }

      // New startups start as "pending" until admin approves
      const startup = await Startup.create({
        founderId: req.user!._id,
        name: name.trim(),
        tagline: tagline?.trim(),
        problem: problem?.trim(),
        solution: solution?.trim(),
        market: market?.trim(),
        industry: industry.trim(),
        stage,
        fundingAsk: fundingAsk ? Number(fundingAsk) : undefined,
        equityOffered: equityOffered !== undefined ? Number(equityOffered) : undefined,
        team: Array.isArray(team) ? team : [],
        status: 'pending',
        viewsCount: 0,
      });

      res.status(201).json({
        success: true,
        message: 'Startup submitted successfully. Status is pending administrator approval.',
        data: { startup },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyStartups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startups = await Startup.find({ founderId: req.user!._id }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: { startups },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStartupById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid startup ID' });
        return;
      }

      const startup = await Startup.findById(id).populate('founderId', 'name email avatarUrl headline');

      if (!startup) {
        res.status(404).json({ success: false, message: 'Startup not found' });
        return;
      }

      // If user is owner or admin, or if startup is approved, allow access
      const isOwner = req.user && startup.founderId._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin && startup.status !== 'approved') {
        res.status(403).json({
          success: false,
          message: 'This startup profile is not public yet.',
        });
        return;
      }

      // Increment view count if viewed by someone else
      if (!isOwner) {
        startup.viewsCount = (startup.viewsCount || 0) + 1;
        await startup.save();
      }

      res.status(200).json({
        success: true,
        data: { startup },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      // Founder only, own startups only
      if (startup.founderId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update your own startups.',
        });
        return;
      }

      const {
        name,
        tagline,
        problem,
        solution,
        market,
        industry,
        stage,
        fundingAsk,
        equityOffered,
        team,
      } = req.body;

      if (name !== undefined) startup.name = name.trim();
      if (tagline !== undefined) startup.tagline = tagline.trim();
      if (problem !== undefined) startup.problem = problem.trim();
      if (solution !== undefined) startup.solution = solution.trim();
      if (market !== undefined) startup.market = market.trim();
      if (industry !== undefined) startup.industry = industry.trim();
      if (stage !== undefined) startup.stage = stage;
      if (fundingAsk !== undefined) startup.fundingAsk = Number(fundingAsk);
      if (equityOffered !== undefined) startup.equityOffered = Number(equityOffered);
      if (team !== undefined && Array.isArray(team)) startup.team = team;

      await startup.save();

      res.status(200).json({
        success: true,
        message: 'Startup updated successfully',
        data: { startup },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStartup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      // Founder only, own startups only
      if (startup.founderId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete your own startups.',
        });
        return;
      }

      // Delete associated documents
      const docs = await DocumentModel.find({ startupId: startup._id });
      for (const doc of docs) {
        await StorageService.deleteFile(doc.fileUrl);
      }
      await DocumentModel.deleteMany({ startupId: startup._id });

      await Startup.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Startup and associated documents deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      // Founder only, own startups only
      if (startup.founderId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only upload documents to your own startup.',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please provide a document file.',
        });
        return;
      }

      const { title, type, accessLevel } = req.body;

      if (!title || !type) {
        res.status(400).json({
          success: false,
          message: 'title and type are required',
        });
        return;
      }

      const validTypes: DocumentType[] = ['patent', 'legal', 'pitchdeck', 'financial', 'other'];
      if (!validTypes.includes(type as DocumentType)) {
        res.status(400).json({
          success: false,
          message: `Invalid document type. Allowed types: ${validTypes.join(', ')}`,
        });
        return;
      }

      const validAccessLevels: AccessLevel[] = ['public', 'locked', 'approved_only'];
      const targetAccessLevel: AccessLevel = accessLevel && validAccessLevels.includes(accessLevel) ? accessLevel : 'locked';

      const { fileUrl } = await StorageService.uploadFile(req.file, 'documents');

      const document = await DocumentModel.create({
        startupId: startup._id,
        title: title.trim(),
        type,
        fileUrl,
        accessLevel: targetAccessLevel,
        uploadedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and linked successfully',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStartupDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const isOwner = req.user && startup.founderId.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      let query: Record<string, any> = { startupId: startup._id };

      // Non-owners only see public documents unless they have approved access
      if (!isOwner && !isAdmin) {
        query.accessLevel = 'public';
      }

      const documents = await DocumentModel.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  }
}
