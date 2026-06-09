import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { UnauthorizedError } from '../../utils/errors';
import { env } from '../../config/env';

const authService = new AuthService();

export const REFRESH_COOKIE_NAME = 'mp_rt';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth',
};

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      setRefreshCookie(res, result.refreshToken);
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      setRefreshCookie(res, result.refreshToken);
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const userId = req.user?.id;

      await authService.logout(refreshToken, userId);
      clearRefreshCookie(res);

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const result = await authService.refresh(refreshToken);
      setRefreshCookie(res, result.refreshToken);
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      clearRefreshCookie(res);
      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }
      await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
      res.status(200).json({ success: true, message: 'Password has been updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
