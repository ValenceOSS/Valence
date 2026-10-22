const LIST = ', ';

const LISTED = new Set(['settings', 'fields']);

const COUNTED = new Set(['attempts']);

/**
 * Joins one thing two changes said into what one entry says of both.
 *
 * @param key - What it is.
 * @param before - What the entry said already, if anything.
 * @param value - What the later change says.
 * @returns What the entry says now.
 */
const mergedValue = (key: string, before: string | undefined, value: string): string => {
  if (before === undefined) {
    return value;
  }

  if (COUNTED.has(key)) {
    return String((Number(before) || 1) + (Number(value) || 1));
  }

  return LISTED.has(key)
    ? [...new Set([...before.split(LIST), ...value.split(LIST)])].join(LIST)
    : value;
};

/**
 * Joins what two changes said into what one entry says of both, so a setting nudged several times
 * in a row reads as one change naming everything that moved rather than a run of entries.
 *
 * What lists things, such as the settings changed, keeps each thing once; what counts things, such
 * as attempts to sign in, adds them up; anything else is said as the later change said it.
 *
 * @param earlier - What the entry said already.
 * @param later - What the change folded into it says.
 * @returns What the entry says now.
 */
const mergeAuditDetail = (
  earlier: Readonly<Record<string, string>> | null,
  later: Readonly<Record<string, string>> | null,
): Record<string, string> | null => {
  if (earlier === null && later === null) {
    return null;
  }

  const merged: Record<string, string> = { ...earlier };

  for (const [key, value] of Object.entries(later ?? {})) {
    merged[key] = mergedValue(key, merged[key], value);
  }

  return merged;
};

export { mergeAuditDetail };
