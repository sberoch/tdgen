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

export function validateFilterToken(token: string): FilterValidationResult {
  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) return { valid: true };

  const identifier = token.substring(0, colonIdx).toLowerCase();
  const value = token.substring(colonIdx + 1);

  const validator = FILTER_VALIDATORS[identifier];

  if (!validator) {
    // Unknown filter name — but only flag if there's actually an identifier before the colon
    if (identifier.length > 0) {
      return { valid: false, error: 'Filtername unbekannt' };
    }
    return { valid: true };
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
