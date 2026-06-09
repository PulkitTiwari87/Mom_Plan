import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { UserRole, UserPlan } from '@prisma/client';

const resetTokensCache = new Map<string, string>();

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

interface AuthUserSummary {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plan: UserPlan;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(64).toString('base64url');
}

function toAuthUser(user: {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plan: UserPlan;
}): AuthUserSummary {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    plan: user.plan,
  };
}

export class AuthService {
  private generateAccessToken(user: AccessTokenPayload): string {
    return jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const rawToken = generateOpaqueRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await prisma.refreshToken.create({
      data: {
        token: tokenHash,
        user_id: userId,
        expires_at: expiresAt,
      },
    });

    return rawToken;
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true },
    });
  }

  private async issueSession(user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    plan: UserPlan;
  }) {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: toAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  async register(data: { email: string; password: string; full_name: string; phone?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email is already registered');
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        full_name: data.full_name,
        phone: data.phone,
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'Welcome to MomPlan!',
      html: `<h1>Welcome to MomPlan, ${user.full_name}!</h1><p>We are thrilled to help you discover and apply for the benefits your family deserves.</p>`,
    });

    return this.issueSession(user);
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || user.status === 'inactive') {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_active_at: new Date() },
    });

    return this.issueSession(user);
  }

  async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { token: tokenHash, revoked: false },
        data: { revoked: true },
      });
    }

    if (userId) {
      await this.revokeAllRefreshTokens(userId);
    }
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.revoked) {
      // Replay attack: revoke all sessions for this user
      await this.revokeAllRefreshTokens(storedToken.user_id);
      throw new UnauthorizedError('Refresh token revoked or invalid');
    }

    if (storedToken.expires_at < new Date()) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = storedToken.user;
    if (!user || user.status === 'inactive') {
      throw new UnauthorizedError('User account not found or inactive');
    }

    // Rotate: revoke the current token before issuing a new one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });
    const newRefreshToken = await this.createRefreshToken(user.id);

    return {
      user: toAuthUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return;
    }

    const resetToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1h' });
    resetTokensCache.set(resetToken, user.id);

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - MomPlan',
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><a href="${resetUrl}">Reset Password</a><p>This link is valid for 1 hour.</p>`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = resetTokensCache.get(token);
    if (!userId) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    resetTokensCache.delete(token);
    await this.revokeAllRefreshTokens(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });
  }
}
