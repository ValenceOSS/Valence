import { z } from 'zod';
import type { Downloads } from './Downloads';

const RELEASES_URL = 'https://api.github.com/repos/ValenceOSS/Valence/releases';

const PAGE_SIZE = 100;

const MOST_PAGES = 10;

const ReleasesSchema = z.array(
  z.object({
    tag_name: z.string(),
    draft: z.boolean(),
    prerelease: z.boolean(),
    published_at: z.string().nullable(),
    assets: z.array(z.object({ download_count: z.number().int().nonnegative() })),
  }),
);

const UNKNOWN: Downloads = { isKnown: false, total: 0, releases: [] };

/**
 * Asks GitHub for one page of the project's releases, kept for an hour between asks.
 *
 * @param page - Which page, from 1.
 * @returns The releases on it, or null where GitHub could not be asked.
 */
const releasesOn = async (page: number) => {
  const token = process.env.GITHUB_TOKEN ?? '';
  const response = await fetch(
    `${RELEASES_URL}?per_page=${PAGE_SIZE.toString()}&page=${page.toString()}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token === '' ? {} : { Authorization: `Bearer ${token}` }),
      },
      next: { revalidate: 3600 },
    },
  ).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const releases = ReleasesSchema.safeParse(await response.json());

  return releases.success ? releases.data : null;
};

/**
 * Counts how many times every published release's files have been downloaded from GitHub, in all
 * and stable release by stable release, newest first.
 *
 * @returns The counts, or that they are not known where GitHub could not be asked.
 */
const readDownloads = async (): Promise<Downloads> => {
  const releases: NonNullable<Awaited<ReturnType<typeof releasesOn>>> = [];

  for (let page = 1; page <= MOST_PAGES; page += 1) {
    const onThisPage = await releasesOn(page);

    if (onThisPage === null) {
      return UNKNOWN;
    }

    releases.push(...onThisPage);

    if (onThisPage.length < PAGE_SIZE) {
      break;
    }
  }

  const published = releases.filter(({ draft }) => !draft);
  const counted = published
    .filter(({ prerelease }) => !prerelease)
    .map(({ tag_name: tag, published_at: publishedAt, assets }) => ({
      tag,
      publishedAt,
      downloads: assets.reduce((sum, { download_count: count }) => sum + count, 0),
    }))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  return {
    isKnown: true,
    total: published.reduce(
      (sum, { assets }) =>
        sum + assets.reduce((inRelease, { download_count: count }) => inRelease + count, 0),
      0,
    ),
    releases: counted,
  };
};

export { RELEASES_URL, readDownloads };
