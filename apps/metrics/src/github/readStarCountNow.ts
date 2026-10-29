import { readStarCount } from '@ValenceCore/project/readStarCount';
import { githubHeaders } from '@ValenceMetrics/github/githubHeaders';

const REPOSITORY_API_URL = 'https://api.github.com/repos/ValenceOSS/Valence';

/**
 * Asks GitHub how many people have starred the project, kept for an hour between asks.
 *
 * @returns The count, or null where GitHub could not be asked or answered with something else.
 */
const readStarCountNow = async (): Promise<number | null> => {
  const response = await fetch(REPOSITORY_API_URL, {
    headers: githubHeaders(),
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  try {
    return readStarCount(await response.json());
  } catch {
    return null;
  }
};

export { REPOSITORY_API_URL, readStarCountNow };
