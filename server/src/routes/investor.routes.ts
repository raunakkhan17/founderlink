import { Router } from 'express';
import { InvestorController } from '../controllers/investor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate as any, authorize('investor', 'admin') as any, InvestorController.getProfile);
router.put('/profile', authenticate as any, authorize('investor', 'admin') as any, InvestorController.updateProfile);
router.get('/saved', authenticate as any, authorize('investor', 'admin') as any, InvestorController.getWatchlist);
router.post('/saved/:id', authenticate as any, authorize('investor', 'admin') as any, InvestorController.saveStartup);
router.delete('/saved/:id', authenticate as any, authorize('investor', 'admin') as any, InvestorController.unsaveStartup);
router.get('/requests', authenticate as any, authorize('investor', 'admin') as any, InvestorController.getMyRequests);

export default router;

