import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/ping',
  authenticate as any,
  authorize('admin') as any,
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'admin ok',
    });
  }
);

export default router;
