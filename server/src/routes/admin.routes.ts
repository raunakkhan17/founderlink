import { Router, Request, Response } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes with authenticate & authorize('admin')
router.use(authenticate as any, authorize('admin') as any);

router.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'admin ok',
  });
});

// Platform stats
router.get('/stats', AdminController.getStats);

// Pending queue & approvals
router.get('/pending/users', AdminController.getPendingUsers);
router.put('/pending/users/:id', AdminController.reviewUser);

router.get('/pending/startups', AdminController.getPendingStartups);
router.put('/pending/startups/:id', AdminController.reviewStartup);

// User management
router.get('/users', AdminController.getUsers);
router.put('/users/:id/suspend', AdminController.toggleSuspendUser);

// Content moderation (delete reported startup/document)
router.delete('/content/:type/:id', AdminController.deleteContent);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
