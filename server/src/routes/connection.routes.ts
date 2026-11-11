import { Router } from 'express';
import { ConnectionController } from '../controllers/connection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate as any, authorize('investor', 'admin') as any, ConnectionController.createConnection);
router.get('/my', authenticate as any, ConnectionController.getMyConnections);

export default router;

