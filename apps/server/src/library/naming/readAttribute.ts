const CLOSERS: Record<string, string> = { '[': ']', '(': ')', '{': '}' };

const SHORTENED: Record<string, string> = { tmdbid: 'tmdb', tvdbid: 'tvdb', imdbid: 'imdb' };

const IMDB_ID = /tt\d{7,8}(?!\d)/u;

/**
 * Reads an identifier written into a file or folder name the way Jellyfin reads one —
 * `[tmdbid-603]`, `{tmdb=603}`, `(imdbid-tt0133093)` — and, for IMDb, any `tt` number anywhere in
 * the name.
 *
 * @param text - The name.
 * @param attribute - Which identifier: `tmdbid`, `tvdbid` or `imdbid`.
 * @returns The identifier, or null where the name carries none.
 */
const readAttribute = (text: string, attribute: 'tmdbid' | 'tvdbid' | 'imdbid'): string | null => {
  const lower = text.toLowerCase();
  const sought = SHORTENED[attribute] ?? attribute;
  let from = 0;

  while (from < lower.length) {
    const at = lower.indexOf(sought, from);

    if (at < 0) {
      break;
    }

    let end = at + sought.length;
    from = end;
    const closer = at > 0 ? CLOSERS[lower.charAt(at - 1)] : undefined;

    if (closer === undefined) {
      continue;
    }

    if (lower.slice(end, end + 2) === 'id') {
      end += 2;
    }

    const separator = lower.charAt(end);
    const closing = lower.indexOf(closer, end);

    if ((separator === '=' || separator === '-') && closing > end + 1) {
      const value = text.slice(end + 1, closing).trim();

      if (value !== '') {
        return value;
      }
    }
  }

  return attribute === 'imdbid' ? (IMDB_ID.exec(text)?.[0] ?? null) : null;
};

export { readAttribute };
