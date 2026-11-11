import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AccessRequestController } from '../controllers/accessRequest.controller';

const router = Router();
router.post('/', authenticate as any, authorize('investor') as any, AccessRequestController.create);
router.get('/mine', authenticate as any, authorize('investor') as any, AccessRequestController.listMine);
export default router;
