import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { avatarUpload } from '../middleware/upload.middleware';

const router = Router();

router.get('/me', authenticate as any, UserController.getMe);
router.put('/me', authenticate as any, UserController.updateMe);
router.post('/me/avatar', authenticate as any, avatarUpload.single('avatar'), UserController.uploadAvatar);

export default router;

