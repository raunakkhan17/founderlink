import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.util';
import { User, IUser, UserRole } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token.',
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact platform support.',
      });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in first.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

export const requireVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in first.',
    });
    return;
  }

  // Admins are automatically verified
  if (req.user.role === 'admin') {
    return next();
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: 'Please verify your email address to proceed.',
      requiresEmailVerification: true,
    });
    return;
  }

  if (req.user.verificationStatus !== 'approved') {
    res.status(403).json({
      success: false,
      message:
        req.user.verificationStatus === 'pending'
          ? 'Your account is pending administrator approval.'
          : 'Your account verification request was rejected.',
      verificationStatus: req.user.verificationStatus,
    });
    return;
  }

  next();
};

