import { Router } from 'express';
import { StartupController } from '../controllers/startup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { documentUpload } from '../middleware/upload.middleware';

const router = Router();

// Startups CRUD (founder only, own startups only)
router.post('/', authenticate as any, authorize('founder') as any, StartupController.createStartup);
router.get('/', authenticate as any, authorize('founder') as any, StartupController.getMyStartups);
router.get('/:id', authenticate as any, StartupController.getStartupById);
router.put('/:id', authenticate as any, authorize('founder') as any, StartupController.updateStartup);
router.delete('/:id', authenticate as any, authorize('founder') as any, StartupController.deleteStartup);

// Documents for startup
router.post('/:id/documents', authenticate as any, authorize('founder') as any, documentUpload.single('file'), StartupController.uploadDocument);
router.get('/:id/documents', authenticate as any, StartupController.getStartupDocuments);

export default router;

