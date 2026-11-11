import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { FileAccessController } from '../controllers/fileAccess.controller';

const router = Router();
router.get('/open/:id', authenticate as any, FileAccessController.open);
router.get('/download/:token', FileAccessController.download);
export default router;
