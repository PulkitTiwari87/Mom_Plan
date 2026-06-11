import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { UserRole } from '@prisma/client';
import {
  isFederalProgram,
  matchesProfileStateScope,
  normalizeStateCode,
} from '../eligibility/eligibility.filters';
import {
  buildQuarterDueDatesByProgramAndYear,
  getAvailableYearsFromProgramYearMap,
  getPrimaryDueDateForProgram,
} from '../programs/quarterDueDates.service';
import { Quarter } from '../programs/quarterDueDates.types';

export type DeadlineDashboardStatus = 'overdue' | 'due_soon' | 'upcoming';

export interface DeadlineDashboardFilters {
  type: 'all' | 'federal' | 'state';
  year: number | 'all';
  quarter: Quarter;
}

export interface DeadlineDashboardResponse {
  items: DeadlineDashboardItem[];
  availableYears: number[];
}

export interface DeadlineDashboardItem {
  programId: string;
  programName: string;
  federalOrState: string;
  nextDueDate: string;
  daysRemaining: number;
  status: DeadlineDashboardStatus;
}

const STATUS_SORT_ORDER: Record<DeadlineDashboardStatus, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
};

function computeDaysRemaining(dueDate: string, referenceDate: Date): number {
  const dueUtc = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const todayUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  return Math.ceil((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function computeDeadlineStatus(daysRemaining: number): DeadlineDashboardStatus {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 30) return 'due_soon';
  return 'upcoming';
}

function sortDashboardItems(items: DeadlineDashboardItem[]): DeadlineDashboardItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;

    if (a.status === 'overdue') {
      return b.daysRemaining - a.daysRemaining;
    }

    return a.daysRemaining - b.daysRemaining;
  });
}

export class DeadlinesService {
  async getDashboard(
    userId: string,
    filters: DeadlineDashboardFilters
  ): Promise<DeadlineDashboardResponse> {
    const [results, user] = await Promise.all([
      prisma.eligibilityResult.findMany({
        where: {
          user_id: userId,
          status: { in: ['qualified', 'likely_qualified'] },
        },
        include: {
          program: {
            select: {
              id: true,
              name: true,
              federal_or_state: true,
              state_code: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { family_profile: true },
      }),
    ]);

    const profileState =
      normalizeStateCode(user?.state) ?? normalizeStateCode(user?.family_profile?.state);

    let scopedResults = profileState
      ? results.filter((result) => matchesProfileStateScope(result.program, profileState))
      : results;

    if (filters.type === 'federal') {
      scopedResults = scopedResults.filter((result) => isFederalProgram(result.program));
    } else if (filters.type === 'state') {
      scopedResults = scopedResults.filter((result) => !isFederalProgram(result.program));
    }

    const programIds = [
      ...new Set(
        scopedResults
          .map((result) => result.program?.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];

    if (programIds.length === 0) {
      return { items: [], availableYears: [] };
    }

    const referenceDate = new Date();
    const quarterRecords = await prisma.programQuarterDueDate.findMany({
      where: { program_id: { in: programIds } },
    });

    const recordsByProgramAndYear = buildQuarterDueDatesByProgramAndYear(quarterRecords);
    const availableYears = getAvailableYearsFromProgramYearMap(recordsByProgramAndYear);

    const recordsByProgram = new Map<string, typeof quarterRecords>();
    for (const record of quarterRecords) {
      const existing = recordsByProgram.get(record.program_id) ?? [];
      existing.push(record);
      recordsByProgram.set(record.program_id, existing);
    }

    const items: DeadlineDashboardItem[] = [];

    for (const result of scopedResults) {
      if (!result.program) continue;

      const records = recordsByProgram.get(result.program.id) ?? [];
      const nextDueDate = getPrimaryDueDateForProgram(
        records.map((record) => ({
          year: record.year,
          quarter: record.quarter as Quarter,
          due_dates_json: record.due_dates_json,
        })),
        filters.year,
        filters.quarter,
        referenceDate
      );

      if (!nextDueDate) continue;

      const daysRemaining = computeDaysRemaining(nextDueDate, referenceDate);
      const status = computeDeadlineStatus(daysRemaining);
      const federalOrState = (result.program.federal_or_state ?? 'unknown').toLowerCase();

      items.push({
        programId: result.program.id,
        programName: result.program.name,
        federalOrState,
        nextDueDate,
        daysRemaining,
        status,
      });
    }

    const uniqueByProgram = new Map<string, DeadlineDashboardItem>();
    for (const item of items) {
      const existing = uniqueByProgram.get(item.programId);
      if (!existing) {
        uniqueByProgram.set(item.programId, item);
        continue;
      }

      if (item.daysRemaining < existing.daysRemaining) {
        uniqueByProgram.set(item.programId, item);
      }
    }

    return {
      items: sortDashboardItems([...uniqueByProgram.values()]),
      availableYears,
    };
  }

  async listDeadlines(userId: string, role: UserRole) {
    if (role === 'admin' || role === 'counselor') {
      return prisma.deadline.findMany({
        include: {
          application: { include: { program: { select: { name: true } } } },
          user: { select: { full_name: true, email: true } },
        },
        orderBy: { due_date: 'asc' },
      });
    }

    return prisma.deadline.findMany({
      where: { user_id: userId },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
      orderBy: { due_date: 'asc' },
    });
  }

  async createDeadline(
    creatorId: string,
    role: UserRole,
    data: { application_id: string; deadline_type: string; due_date: string }
  ) {
    const application = await prisma.application.findUnique({
      where: { id: data.application_id },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    // Normal users can only create deadlines for their own application
    if (role === 'user' && application.user_id !== creatorId) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.deadline.create({
      data: {
        user_id: application.user_id,
        application_id: data.application_id,
        deadline_type: data.deadline_type,
        due_date: new Date(data.due_date),
        is_completed: false,
      },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
    });
  }

  async completeDeadline(id: string, userId: string, role: UserRole) {
    const deadline = await prisma.deadline.findUnique({
      where: { id },
    });

    if (!deadline) {
      throw new NotFoundError('Deadline not found');
    }

    if (role === 'user' && deadline.user_id !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.deadline.update({
      where: { id },
      data: { is_completed: true },
      include: {
        application: { include: { program: { select: { name: true } } } },
      },
    });
  }

  async deleteDeadline(id: string, userId: string, role: UserRole) {
    const deadline = await prisma.deadline.findUnique({ where: { id } });
    if (!deadline) throw new NotFoundError('Deadline not found');
    if (role === 'user' && deadline.user_id !== userId) throw new ForbiddenError('Access denied');
    await prisma.deadline.delete({ where: { id } });
  }
}
