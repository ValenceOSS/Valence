import { useEffect, useState } from 'react';

/**
 * Whether the page matches a media query now, answered again whenever that changes.
 *
 * Answers `true` where there is no `matchMedia` to ask, since a server rendering a page and a test
 * environment are both better served by the arrangement that has room than by one that assumes a
 * phone.
 *
 * @param query - The media query, such as `(min-width: 48rem)`.
 * @returns Whether it matches.
 */
const useMatchesMedia = (query: string): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia(query).matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const asked = window.matchMedia(query);

    const answer = (): void => {
      setMatches(asked.matches);
    };

    answer();

    asked.addEventListener('change', answer);

    return () => {
      asked.removeEventListener('change', answer);
    };
  }, [query]);

  return matches;
};

export { useMatchesMedia };
