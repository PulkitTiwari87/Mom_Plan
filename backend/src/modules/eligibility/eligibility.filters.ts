import {
  getQuarterForMonth,
  programHasMatchingQuarterData,
  QuarterDueDatesByProgramAndYear,
} from '../programs/quarterDueDates.service';
import { Quarter, QUARTERS } from '../programs/quarterDueDates.types';

export interface EligibilityResultsFilters {
  profileState?: string;
  federal?: boolean;
  stateOnly?: boolean;
  state?: string;
  stateSearch?: string;
  year?: number | 'all';
  quarter?: Quarter;
}

export interface EligibilityResultsSummary {
  qualifiedCount: number;
  totalMonthlyValueMax: number;
  totalCount: number;
}

export interface AvailableStateOption {
  code: string;
  label: string;
}

export interface EligibilityResultsResponse {
  results: unknown[];
  summary: EligibilityResultsSummary;
  availableStates: AvailableStateOption[];
  availableYears: number[];
  profileState: string | null;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const STATE_LABEL_BY_CODE = Object.fromEntries(US_STATES.map((state) => [state.value, state.label]));

type ProgramLike = {
  federal_or_state?: string | null;
  state_code?: string | null;
};

type ResultLike = {
  status: string;
  program: ProgramLike | null;
  program_id: string;
};

export function getProgramStateCode(program: ProgramLike | null | undefined): string {
  return (program?.state_code ?? '').trim().toUpperCase();
}

export function normalizeStateCode(state: string | null | undefined): string | undefined {
  const code = (state ?? '').trim().toUpperCase();
  return code || undefined;
}

export function isFederalProgram(program: ProgramLike | null | undefined): boolean {
  const fedOrState = (program?.federal_or_state ?? '').toLowerCase();
  return fedOrState === 'federal' || fedOrState.includes('federal');
}

export function matchesProfileStateScope(
  program: ProgramLike | null | undefined,
  profileState: string
): boolean {
  if (isFederalProgram(program)) return true;
  return getProgramStateCode(program) === profileState;
}

export function stateMatchesQuery(stateCode: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const code = stateCode.toLowerCase();
  if (code.includes(q)) return true;

  const label = (STATE_LABEL_BY_CODE[stateCode] ?? '').toLowerCase();
  return label.includes(q);
}

export function computeSummary(results: ResultLike[]): EligibilityResultsSummary {
  const qualified = results.filter((result) =>
    ['qualified', 'likely_qualified'].includes(result.status)
  );

  return {
    qualifiedCount: qualified.length,
    totalMonthlyValueMax: qualified.reduce(
      (acc, result) => acc + ((result.program as { estimated_monthly_value_max?: number } | null)?.estimated_monthly_value_max ?? 0),
      0
    ),
    totalCount: results.length,
  };
}

export function computeAvailableStates(results: ResultLike[]): AvailableStateOption[] {
  const codes = new Set<string>();

  for (const result of results) {
    const code = getProgramStateCode(result.program);
    if (code) codes.add(code);
  }

  return [...codes]
    .sort()
    .map((code) => ({
      code,
      label: STATE_LABEL_BY_CODE[code] ?? code,
    }));
}

export function filterStateOptions(
  options: AvailableStateOption[],
  query: string
): AvailableStateOption[] {
  if (!query.trim()) return options;

  return options.filter(
    (option) =>
      stateMatchesQuery(option.code, query) ||
      option.label.toLowerCase().includes(query.trim().toLowerCase())
  );
}

export function applyEligibilityFilters<T extends ResultLike>(
  results: T[],
  filters?: EligibilityResultsFilters,
  quarterDueDatesByProgramAndYear?: QuarterDueDatesByProgramAndYear
): T[] {
  if (!filters) return results;

  let filtered = results;

  if (filters.profileState) {
    filtered = filtered.filter((result) =>
      matchesProfileStateScope(result.program, filters.profileState!)
    );
  }

  if (filters.federal) {
    filtered = filtered.filter((result) => isFederalProgram(result.program));
  }

  if (filters.stateOnly) {
    filtered = filtered.filter((result) => !!getProgramStateCode(result.program));
  }

  if (filters.state) {
    const targetState = filters.state.trim().toUpperCase();
    filtered = filtered.filter(
      (result) => getProgramStateCode(result.program) === targetState
    );
  } else if (filters.stateSearch?.trim()) {
    const query = filters.stateSearch.trim();
    filtered = filtered.filter((result) =>
      stateMatchesQuery(getProgramStateCode(result.program), query)
    );
  }

  const yearFilter = filters.year ?? 'all';
  const quarterFilter =
    filters.quarter ?? getQuarterForMonth(new Date().getUTCMonth() + 1);

  if (quarterDueDatesByProgramAndYear) {
    filtered = filtered.filter((result) =>
      programHasMatchingQuarterData(
        quarterDueDatesByProgramAndYear.get(result.program_id),
        yearFilter,
        quarterFilter
      )
    );
  }

  return filtered;
}

function parseYearFilter(value: unknown): number | 'all' {
  if (value === 'all' || value === undefined || value === '') return 'all';
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 'all';
}

export function parseEligibilityResultsFilters(query: Record<string, unknown>): EligibilityResultsFilters {
  const quarter = typeof query.quarter === 'string' ? query.quarter : undefined;
  const validQuarter =
    quarter && (QUARTERS as readonly string[]).includes(quarter)
      ? (quarter as Quarter)
      : getQuarterForMonth(new Date().getUTCMonth() + 1);

  return {
    federal: query.federal === 'true' || query.federal === true,
    stateOnly: query.state_only === 'true' || query.state_only === true,
    state: typeof query.state === 'string' && query.state.trim() ? query.state.trim() : undefined,
    stateSearch:
      typeof query.state_search === 'string' && query.state_search.trim()
        ? query.state_search.trim()
        : undefined,
    year: parseYearFilter(query.year),
    quarter: validQuarter,
  };
}
