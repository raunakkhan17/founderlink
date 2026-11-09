import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import startupRoutes from './startup.routes';
import documentRoutes from './document.routes';
import founderRoutes from './founder.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/startups', startupRoutes);
router.use('/documents', documentRoutes);
router.use('/founder', founderRoutes);

export default router;

