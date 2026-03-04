export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

export interface FilterValidationResult {
  valid: boolean;
  error?: string;
}

function isValidDate(v: string): boolean {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(v);
}

function isValidUserId(v: string): boolean {
  return /^\d{6}$/.test(v);
}

function isValidBoolean(v: string): boolean {
  return ['true', 'false', 'yes', 'no'].includes(v.toLowerCase());
}

function isValidPaygroup(v: string): boolean {
  const n = parseInt(v, 10);
  return /^\d{1,2}$/.test(v) && n >= 1 && n <= 15;
}

const FILTER_VALIDATORS: Record<string, (value: string) => boolean> = {
  createdbefore: isValidDate,
  createdat: isValidDate,
  createdafter: isValidDate,
  modifiedbefore: isValidDate,
  modifiedat: isValidDate,
  modifiedafter: isValidDate,
  createdby: isValidUserId,
  modifiedby: isValidUserId,
  readonly: isValidBoolean,
  paygroup: isValidPaygroup,
};

export type FilterContext = 'jt' | 'jd' | 'backlog';

const EXCLUDED_FILTERS: Record<FilterContext, string[]> = {
  jt: [],
  jd: ['paygroup'],
  backlog: [],
};

export function validateFilterToken(token: string, context: FilterContext = 'backlog'): FilterValidationResult {
  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) return { valid: true };

  const identifier = token.substring(0, colonIdx).toLowerCase();
  const value = token.substring(colonIdx + 1);

  // Check if filter is excluded for this context
  if (EXCLUDED_FILTERS[context].includes(identifier)) {
    return { valid: false, error: 'Filtername unbekannt' };
  }

  const validator = FILTER_VALIDATORS[identifier];

  if (!validator) {
    return { valid: false, error: 'Filtername unbekannt' };
  }

  // Known filter but no value yet (still typing)
  if (!value) {
    return { valid: true };
  }

  // Known filter with value — validate format
  if (!validator(value)) {
    return { valid: false, error: 'Fehlerhafter Wert' };
  }

  return { valid: true };
}

// Maps lowercase filter identifiers to the API query param names
const FILTER_TO_PARAM: Record<string, string> = {
  createdbefore: 'createdBefore',
  createdat: 'createdAt',
  createdafter: 'createdAfter',
  modifiedbefore: 'modifiedBefore',
  modifiedat: 'modifiedAt',
  modifiedafter: 'modifiedAfter',
  createdby: 'createdById',
  modifiedby: 'modifiedBy',
  readonly: 'readonly',
  paygroup: 'paygroup',
};

export const TOKEN_REGEX = /[A-Za-z]+:(?:[A-Za-z0-9,.]+|"[^"]*")?(?=\s|$)/g;

export interface ExtractedFilters {
  filters: Record<string, string>;
  freeText: string;
}

export function extractFilters(text: string, context: FilterContext = 'backlog'): ExtractedFilters {
  const filters: Record<string, string> = {};
  const freeText = text.replace(TOKEN_REGEX, (match) => {
    const result = validateFilterToken(match, context);
    if (!result.valid) return ''; // Skip invalid tokens
    const colonIdx = match.indexOf(':');
    const identifier = match.substring(0, colonIdx).toLowerCase();
    const value = match.substring(colonIdx + 1);
    const paramName = FILTER_TO_PARAM[identifier];
    if (paramName && value) {
      filters[paramName] = value;
    }
    return ''; // Remove token from text
  }).replace(/\s+/g, ' ').trim();

  return { filters, freeText };
}
