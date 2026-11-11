import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Startup } from '../models/startup.model';
import { DocumentModel, DocumentType, AccessLevel } from '../models/document.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/auditLog.model';
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

  static async getStartups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isFounder = req.user?.role === 'founder';
      const isBrowse = req.query.browse === 'true';
      const hasSearchOrFilter = Boolean(
        req.query.search ||
        req.query.industry ||
        req.query.stage ||
        req.query.minFunding ||
        req.query.maxFunding ||
        req.query.sort ||
        req.query.page
      );

      // If founder requests without browse or filter flags, return founder's own startups (backward compatibility)
      if (isFounder && !isBrowse && !hasSearchOrFilter) {
        const startups = await Startup.find({ founderId: req.user!._id }).sort({ createdAt: -1 });
        res.status(200).json({
          success: true,
          data: { startups, total: startups.length },
        });
        return;
      }

      // Marketplace / Investor browse query: Approved only!
      const query: Record<string, any> = { status: 'approved' };

      // Search (matches name, tagline, problem, solution, industry)
      if (req.query.search) {
        const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { tagline: searchRegex },
          { problem: searchRegex },
          { solution: searchRegex },
          { industry: searchRegex },
        ];
      }

      // Industry filter
      if (req.query.industry && req.query.industry !== 'all') {
        query.industry = req.query.industry;
      }

      // Stage filter
      if (req.query.stage && req.query.stage !== 'all') {
        query.stage = req.query.stage;
      }

      // Funding range
      if (req.query.minFunding !== undefined || req.query.maxFunding !== undefined) {
        query.fundingAsk = {};
        if (req.query.minFunding !== undefined && req.query.minFunding !== '') {
          query.fundingAsk.$gte = Number(req.query.minFunding);
        }
        if (req.query.maxFunding !== undefined && req.query.maxFunding !== '') {
          query.fundingAsk.$lte = Number(req.query.maxFunding);
        }
        if (Object.keys(query.fundingAsk).length === 0) {
          delete query.fundingAsk;
        }
      }

      // Sorting
      let sortOption: Record<string, any> = { createdAt: -1 };
      if (req.query.sort === 'views') {
        sortOption = { viewsCount: -1 };
      } else if (req.query.sort === 'funding_asc') {
        sortOption = { fundingAsk: 1 };
      } else if (req.query.sort === 'funding_desc') {
        sortOption = { fundingAsk: -1 };
      } else if (req.query.sort === 'recent') {
        sortOption = { createdAt: -1 };
      }

      // Pagination
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || '12'), 10)));
      const skip = (page - 1) * limit;

      const total = await Startup.countDocuments(query);
      const startups = await Startup.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('founderId', 'name email avatarUrl headline');

      const totalPages = Math.ceil(total / limit) || 1;

      res.status(200).json({
        success: true,
        data: {
          startups,
          total,
          page,
          totalPages,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias for backward compatibility
  static async getMyStartups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    return StartupController.getStartups(req, res, next);
  }

  static async getStartupById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid startup ID' });
        return;
      }

      const startup = await Startup.findById(id).populate('founderId', 'name email avatarUrl headline bio');

      if (!startup) {
        res.status(404).json({ success: false, message: 'Startup not found' });
        return;
      }

      // If user is owner or admin, or if startup is approved, allow access
      const founderDoc = startup.founderId as any;
      const founderIdStr = founderDoc?._id ? founderDoc._id.toString() : startup.founderId.toString();
      const isOwner = req.user && founderIdStr === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin && startup.status !== 'approved') {
        res.status(403).json({
          success: false,
          message: 'This startup profile is not public yet.',
        });
        return;
      }

      // Increment view count: once per investor per day
      if (!isOwner && req.user?.role === 'investor') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const viewedToday = await AuditLog.findOne({
          userId: req.user._id,
          action: 'startup_view',
          targetId: startup._id,
          createdAt: { $gte: startOfDay },
        });

        if (!viewedToday) {
          startup.viewsCount = (startup.viewsCount || 0) + 1;
          await startup.save();

          await AuditLog.create({
            userId: req.user._id,
            action: 'startup_view',
            targetType: 'startup',
            targetId: startup._id,
            ip: req.ip,
          });
        }
      } else if (!isOwner && !req.user) {
        startup.viewsCount = (startup.viewsCount || 0) + 1;
        await startup.save();
      }

      // Fetch documents for startup
      const documents = await DocumentModel.find({ startupId: startup._id }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          startup,
          documents,
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

  static async getSavedStartups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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
