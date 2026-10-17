import { z } from 'zod';
import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';
import { saying } from '@ValenceI18n/saying';
import { compareReleases } from './compareReleases';
import type { UpdateChecker } from './UpdateChecker';

const RECENT_RELEASES = 'https://api.github.com/repos/ValenceOSS/Valence/releases?per_page=15';

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

const ReleaseSchema = z.object({
  tag_name: z.string(),
  published_at: z.string().datetime().nullable(),
  body: z.string().nullable(),
  html_url: z.string().url(),
  draft: z.boolean().default(false),
  prerelease: z.boolean().default(false),
});

const ReleasesSchema = z.array(ReleaseSchema);

type CreateUpdateCheckerOptions = {
  current: string;
  isEnabled: boolean;
  fetchReleases?: () => Promise<Response>;
  now?: () => Date;
};

/**
 * Asks GitHub for the recent releases of Valence, at most every six hours, so the admin area can say
 * when this server is behind and what changed in each release before it. Drafts and pre-releases are
 * left out. Nothing about the server is sent, and a server told not to check never asks.
 *
 * @param current - The release this server runs.
 * @param isEnabled - Whether to ask at all.
 * @param fetchReleases - How to ask for the recent releases, newest first.
 * @param now - The clock.
 * @returns The checker.
 */
const createUpdateChecker = ({
  current,
  isEnabled,
  fetchReleases = () =>
    fetch(RECENT_RELEASES, {
      headers: { accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10_000),
    }),
  now = () => new Date(),
}: CreateUpdateCheckerOptions): UpdateChecker => {
  const unknown: UpdateCheck = {
    current,
    latest: null,
    isNewer: false,
    publishedAt: null,
    notes: null,
    url: null,
    history: [],
    checkedAt: null,
    isEnabled,
    problem: null,
  };
  let last = unknown;
  let lastAt = 0;

  const check = async (): Promise<UpdateCheck> => {
    const checkedAt = now();

    try {
      const answer = await fetchReleases();

      if (!answer.ok) {
        return {
          ...last,
          checkedAt: checkedAt.toISOString(),
          problem: saying('server.updates.createUpdateChecker.githubAnsweredStatus', {
            status: answer.status.toString(),
          }),
        };
      }

      const history = ReleasesSchema.parse(await answer.json())
        .filter((release) => !release.draft && !release.prerelease)
        .map((release) => ({
          version: release.tag_name.replace(/^v/, ''),
          publishedAt: release.published_at,
          notes: release.body,
          url: release.html_url,
          isNewer: compareReleases(release.tag_name, current) > 0,
          isCurrent: compareReleases(release.tag_name, current) === 0,
        }));
      const [latest] = history;

      return {
        current,
        latest: latest?.version ?? null,
        isNewer: latest?.isNewer ?? false,
        publishedAt: latest?.publishedAt ?? null,
        notes: latest?.notes ?? null,
        url: latest?.url ?? null,
        history,
        checkedAt: checkedAt.toISOString(),
        isEnabled,
        problem: null,
      };
    } catch {
      return {
        ...last,
        checkedAt: checkedAt.toISOString(),
        problem: saying('server.updates.createUpdateChecker.githubCouldNotBeReached'),
      };
    }
  };

  return {
    read: async (isForced = false) => {
      if (!isEnabled) {
        return unknown;
      }

      if (isForced || lastAt === 0 || now().getTime() - lastAt >= CHECK_EVERY_MS) {
        last = await check();
        lastAt = now().getTime();
      }

      return last;
    },
  };
};

export type { CreateUpdateCheckerOptions };

export { createUpdateChecker };
