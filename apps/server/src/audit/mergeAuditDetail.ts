const LIST = ', ';

const LISTED = new Set(['settings', 'fields']);

/**
 * Joins what two changes said into what one entry says of both, so a setting nudged several times
 * in a row reads as one change naming everything that moved rather than a run of entries.
 *
 * What lists things, such as the settings changed, keeps each thing once; anything else is said as
 * the later change said it.
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
    const before = merged[key];

    merged[key] =
      before === undefined || !LISTED.has(key)
        ? value
        : [...new Set([...before.split(LIST), ...value.split(LIST)])].join(LIST);
  }

  return merged;
};

export { mergeAuditDetail };
