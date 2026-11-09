import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.put('/:id/access-level', authenticate as any, authorize('founder', 'admin') as any, DocumentController.updateAccessLevel);
router.delete('/:id', authenticate as any, authorize('founder', 'admin') as any, DocumentController.deleteDocument);

export default router;

