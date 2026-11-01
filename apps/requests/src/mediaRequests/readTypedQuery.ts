const LONGEST = 200;

/**
 * Reads what somebody typed to search for a request by hand from an address's query, so that it is
 * searched for in place of what the request would be searched for by itself.
 *
 * @param query - What was typed, as the query wrote it.
 * @returns It, trimmed and no longer than an indexer is asked for, or nothing where nothing was
 *   typed.
 */
const readTypedQuery = (query: string | undefined): string | null => {
  const typed = query?.replace(/\s+/gu, ' ').trim().slice(0, LONGEST) ?? '';

  return typed === '' ? null : typed;
};

export { readTypedQuery };
