const NAMED: Readonly<Record<string, string>> = {
  asc: 'Ascending',
  desc: 'Descending',
};

/**
 * Names one choice of a site setting for a person, where the definition gives only the value it
 * sends — `desc`, `created` — as its label.
 *
 * @param label - The label as the definition gives it.
 * @returns The label to show.
 */
const describeOptionLabel = (label: string): string => {
  const named = NAMED[label.trim().toLowerCase()];

  if (named !== undefined) {
    return named;
  }

  return label === '' ? label : `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

export { describeOptionLabel };
