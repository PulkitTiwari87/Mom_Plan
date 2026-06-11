import { Request, Response, NextFunction } from 'express';
import { DeadlinesService } from './deadlines.service';
import { UnauthorizedError } from '../../utils/errors';

const deadlinesService = new DeadlinesService();

export class DeadlinesController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const type = (req.query.type as 'all' | 'federal' | 'state') || 'all';
      const quarter = (req.query.quarter as 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4') || 'all';
      const data = await deadlinesService.getDashboard(req.user.id, { type, quarter });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async listDeadlines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadlines = await deadlinesService.listDeadlines(req.user.id, req.user.role);
      res.status(200).json({ success: true, data: deadlines });
    } catch (error) {
      next(error);
    }
  }

  async createDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadline = await deadlinesService.createDeadline(req.user.id, req.user.role, req.body);
      res.status(201).json({ success: true, data: deadline });
    } catch (error) {
      next(error);
    }
  }

  async completeDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const deadline = await deadlinesService.completeDeadline(req.params.id, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: deadline });
    } catch (error) {
      next(error);
    }
  }

  async deleteDeadline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await deadlinesService.deleteDeadline(req.params.id, req.user.id, req.user.role);
      res.status(200).json({ success: true, message: 'Deadline deleted' });
    } catch (error) {
      next(error);
    }
  }
}
