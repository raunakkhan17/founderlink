import { Router } from 'express';
import { FounderController } from '../controllers/founder.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Founder dashboard stats and requests inbox
router.get('/stats', authenticate as any, authorize('founder') as any, FounderController.getDashboardStats);
router.get('/access-requests', authenticate as any, authorize('founder') as any, FounderController.getAccessRequests);
router.put('/access-requests/:id', authenticate as any, authorize('founder') as any, FounderController.updateAccessRequest);
router.get('/connections', authenticate as any, authorize('founder') as any, FounderController.getConnectionRequests);
router.put('/connections/:id', authenticate as any, authorize('founder') as any, FounderController.updateConnectionRequest);

export default router;

