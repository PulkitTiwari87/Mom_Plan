import { QuarterDueDateSource as PrismaQuarterDueDateSource } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  QUARTERS,
  QUARTER_MONTHS,
  Quarter,
  QuarterDueDateSource,
  GovtQuarterDueDateInput,
} from './quarterDueDates.types';

/** Last calendar day of `month` (1–12) in `year`, as YYYY-MM-DD. */
export function lastDayOfMonthIso(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month, 0));
  return date.toISOString().slice(0, 10);
}

export function getQuarterForMonth(month: number): Quarter {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

export function parseDueDatesJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .sort();
}

export function generateDueDatesForQuarter(
  renewalPeriodMonths: number | null | undefined,
  quarter: Quarter,
  year: number
): { dueDates: string[]; source: QuarterDueDateSource | null } {
  if (renewalPeriodMonths == null) {
    return { dueDates: [], source: null };
  }

  const months = QUARTER_MONTHS[quarter];

  switch (renewalPeriodMonths) {
    case 1:
      return {
        dueDates: months.map((month) => lastDayOfMonthIso(year, month)),
        source: 'CALCULATED',
      };
    case 3:
      return {
        dueDates: [lastDayOfMonthIso(year, months[2])],
        source: 'CALCULATED',
      };
    case 6: {
      const month = quarter === 'Q1' || quarter === 'Q2' ? 6 : 12;
      return {
        dueDates: [lastDayOfMonthIso(year, month)],
        source: 'CALCULATED',
      };
    }
    case 12:
      return {
        dueDates: [lastDayOfMonthIso(year, 12)],
        source: 'CALCULATED',
      };
    default:
      return { dueDates: [], source: null };
  }
}

/** Next upcoming date within a quarter, or the last date if all have passed. */
export function getRelevantDueDateInQuarter(
  dueDates: string[],
  referenceDate: Date = new Date()
): string | null {
  if (dueDates.length === 0) return null;

  const today = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  const parsed = [...dueDates]
    .sort()
    .map((dateStr) => new Date(`${dateStr}T00:00:00.000Z`))
    .filter((date) => !Number.isNaN(date.getTime()));

  for (const date of parsed) {
    if (date.getTime() >= today.getTime()) {
      return date.toISOString().slice(0, 10);
    }
  }

  const last = parsed[parsed.length - 1];
  return last ? last.toISOString().slice(0, 10) : null;
}

export function getNextUpcomingDueDate(
  quarterRecords: Array<{ year: number; quarter: Quarter; due_dates_json: unknown }>,
  referenceDate: Date = new Date()
): string | null {
  const today = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  const ordered = [...quarterRecords].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return QUARTERS.indexOf(a.quarter) - QUARTERS.indexOf(b.quarter);
  });

  const allDates: Date[] = [];
  for (const record of ordered) {
    for (const dateStr of parseDueDatesJson(record.due_dates_json)) {
      const parsed = new Date(`${dateStr}T00:00:00.000Z`);
      if (!Number.isNaN(parsed.getTime())) {
        allDates.push(parsed);
      }
    }
  }

  allDates.sort((a, b) => a.getTime() - b.getTime());

  for (const date of allDates) {
    if (date.getTime() >= today.getTime()) {
      return date.toISOString().slice(0, 10);
    }
  }

  return null;
}

export class QuarterDueDatesService {
  async getQuarterDueDatesForProgram(programId: string, year: number) {
    return prisma.programQuarterDueDate.findMany({
      where: { program_id: programId, year },
      orderBy: { quarter: 'asc' },
    });
  }

  async getNextDueDateForProgram(programId: string, referenceDate?: Date): Promise<string | null> {
    const currentYear = (referenceDate ?? new Date()).getUTCFullYear();
    const records = await prisma.programQuarterDueDate.findMany({
      where: {
        program_id: programId,
        year: { in: [currentYear, currentYear + 1] },
      },
    });

    if (records.length === 0) return null;

    return getNextUpcomingDueDate(
      records.map((record) => ({
        year: record.year,
        quarter: record.quarter as Quarter,
        due_dates_json: record.due_dates_json,
      })),
      referenceDate
    );
  }

  async getCurrentQuarterDueInfoForProgram(
    programId: string,
    referenceDate?: Date
  ): Promise<{ quarter: Quarter; due_date: string | null }> {
    const ref = referenceDate ?? new Date();
    const year = ref.getUTCFullYear();
    const quarter = getQuarterForMonth(ref.getUTCMonth() + 1);

    const record = await prisma.programQuarterDueDate.findUnique({
      where: {
        program_id_year_quarter: {
          program_id: programId,
          year,
          quarter,
        },
      },
    });

    if (!record) {
      return { quarter, due_date: null };
    }

    const dueDates = parseDueDatesJson(record.due_dates_json);
    return {
      quarter,
      due_date: getRelevantDueDateInQuarter(dueDates, ref),
    };
  }

  /**
   * Idempotent backfill for a single program/year.
   * Preserves GOVT rows; only updates or creates CALCULATED/empty rows.
   */
  async backfillProgramQuarters(programId: string, year: number) {
    const program = await prisma.benefitProgram.findUnique({
      where: { id: programId },
      select: { id: true, renewal_period_months: true },
    });

    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }

    const results = [];

    for (const quarter of QUARTERS) {
      const existing = await prisma.programQuarterDueDate.findUnique({
        where: {
          program_id_year_quarter: {
            program_id: programId,
            year,
            quarter,
          },
        },
      });

      if (existing?.source === PrismaQuarterDueDateSource.GOVT) {
        results.push({ quarter, action: 'skipped_govt' as const });
        continue;
      }

      const { dueDates, source } = generateDueDatesForQuarter(
        program.renewal_period_months,
        quarter,
        year
      );

      await prisma.programQuarterDueDate.upsert({
        where: {
          program_id_year_quarter: {
            program_id: programId,
            year,
            quarter,
          },
        },
        create: {
          program_id: programId,
          year,
          quarter,
          due_dates_json: dueDates,
          source: source ?? undefined,
        },
        update: {
          due_dates_json: dueDates,
          source: source ?? null,
        },
      });

      results.push({ quarter, action: existing ? 'updated' : 'created', source });
    }

    return results;
  }

  async backfillAllPrograms(year?: number) {
    const targetYear = year ?? new Date().getUTCFullYear();
    const programs = await prisma.benefitProgram.findMany({
      select: { id: true, name: true },
    });

    const summary = {
      year: targetYear,
      programsProcessed: 0,
      quartersCreated: 0,
      quartersUpdated: 0,
      quartersSkippedGovt: 0,
      errors: [] as Array<{ programId: string; error: string }>,
    };

    for (const program of programs) {
      try {
        const results = await this.backfillProgramQuarters(program.id, targetYear);
        summary.programsProcessed += 1;

        for (const result of results) {
          if (result.action === 'skipped_govt') {
            summary.quartersSkippedGovt += 1;
          } else if (result.action === 'created') {
            summary.quartersCreated += 1;
          } else if (result.action === 'updated') {
            summary.quartersUpdated += 1;
          }
        }
      } catch (error: any) {
        summary.errors.push({
          programId: program.id,
          error: error?.message ?? 'Unknown error',
        });
      }
    }

    return summary;
  }

  /**
   * Import government scraper data. GOVT values take priority over CALCULATED.
   */
  async upsertGovtQuarterData(input: GovtQuarterDueDateInput) {
    const existing = await prisma.programQuarterDueDate.findUnique({
      where: {
        program_id_year_quarter: {
          program_id: input.program_id,
          year: input.year,
          quarter: input.quarter,
        },
      },
    });

    const sortedDates = [...input.due_dates].sort();

    if (existing?.source === PrismaQuarterDueDateSource.GOVT) {
      return prisma.programQuarterDueDate.update({
        where: { id: existing.id },
        data: {
          due_dates_json: sortedDates,
          source: PrismaQuarterDueDateSource.GOVT,
        },
      });
    }

    return prisma.programQuarterDueDate.upsert({
      where: {
        program_id_year_quarter: {
          program_id: input.program_id,
          year: input.year,
          quarter: input.quarter,
        },
      },
      create: {
        program_id: input.program_id,
        year: input.year,
        quarter: input.quarter,
        due_dates_json: sortedDates,
        source: PrismaQuarterDueDateSource.GOVT,
      },
      update: {
        due_dates_json: sortedDates,
        source: PrismaQuarterDueDateSource.GOVT,
      },
    });
  }

  async regenerateCalculatedQuarters(programId: string, year?: number) {
    const targetYear = year ?? new Date().getUTCFullYear();
    return this.backfillProgramQuarters(programId, targetYear);
  }
}

export const quarterDueDatesService = new QuarterDueDatesService();
