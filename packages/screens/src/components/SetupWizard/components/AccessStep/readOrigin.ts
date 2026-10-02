/**
 * Reads an address typed as one somebody opens Valence on, down to the origin a browser sends: its
 * scheme, host and port, without any path. Only web addresses count.
 *
 * @param typed - What was typed.
 * @returns The origin, or null where it is not a web address.
 */
const readOrigin = (typed: string): string | null => {
  const parsed = URL.parse(typed.trim());

  return parsed === null || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    ? null
    : parsed.origin;
};

export { readOrigin };
