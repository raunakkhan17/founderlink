import { Router } from 'express';
import { StartupController } from '../controllers/startup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { documentUpload } from '../middleware/upload.middleware';

const router = Router();

// Startups CRUD
router.post('/', authenticate as any, authorize('founder') as any, StartupController.createStartup);
router.get('/', authenticate as any, StartupController.getStartups);
router.get('/saved', authenticate as any, StartupController.getSavedStartups);
router.get('/:id', authenticate as any, StartupController.getStartupById);
router.put('/:id', authenticate as any, authorize('founder') as any, StartupController.updateStartup);
router.delete('/:id', authenticate as any, authorize('founder') as any, StartupController.deleteStartup);

// Watchlist save/unsave
router.post('/:id/save', authenticate as any, StartupController.saveStartup);
router.delete('/:id/save', authenticate as any, StartupController.unsaveStartup);

// Documents for startup
router.post('/:id/documents', authenticate as any, authorize('founder') as any, documentUpload.single('file'), StartupController.uploadDocument);
router.get('/:id/documents', authenticate as any, StartupController.getStartupDocuments);

export default router;

