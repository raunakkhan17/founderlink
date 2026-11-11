import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/:id/access', authenticate as any, DocumentController.getDocumentAccess);
router.get('/:id', authenticate as any, DocumentController.getDocumentAccess);
router.put('/:id/access-level', authenticate as any, authorize('founder', 'admin') as any, DocumentController.updateAccessLevel);
router.delete('/:id', authenticate as any, authorize('founder', 'admin') as any, DocumentController.deleteDocument);

export default router;

