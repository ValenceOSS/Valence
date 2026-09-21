type SearchEntry = {
  path: string;
  title: string;
  sectionTitle: string;
  text: string;
};

type SearchResult = {
  path: string;
  title: string;
  sectionTitle: string;
  snippet: string;
};

const MAXIMUM_RESULTS = 8;

const SNIPPET_LENGTH = 140;

/**
 * Finds the pages that mention every word somebody typed.
 *
 * A word in a title counts for much more than one in the body, and a whole phrase in the body counts
 * for more than the same words apart, so the page somebody meant comes first.
 *
 * @param entries - Each page's title and searchable text.
 * @param query - What was typed.
 * @returns The best matches, best first, each with the passage that matched.
 */
const searchDocs = (entries: readonly SearchEntry[], query: string): readonly SearchResult[] => {
  const words = query.toLowerCase().split(/\s+/u).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  return entries
    .flatMap((entry) => {
      const title = entry.title.toLowerCase();
      const text = entry.text.toLowerCase();

      if (!words.every((word) => title.includes(word) || text.includes(word))) {
        return [];
      }

      const phrase = text.indexOf(words.join(' '));
      const first = text.indexOf(words.find((word) => text.includes(word)) ?? '');
      const at = Math.max(phrase === -1 ? first : phrase, 0);
      const score =
        words.filter((word) => title.includes(word)).length * 10 + (phrase === -1 ? 0 : 5) + 1;

      return [
        {
          score,
          result: {
            path: entry.path,
            title: entry.title,
            sectionTitle: entry.sectionTitle,
            snippet: entry.text.slice(Math.max(at - 40, 0), Math.max(at - 40, 0) + SNIPPET_LENGTH),
          },
        },
      ];
    })
    .toSorted((a, b) => b.score - a.score)
    .slice(0, MAXIMUM_RESULTS)
    .map(({ result }) => result);
};

export type { SearchEntry, SearchResult };

export { searchDocs };
