import { z } from 'zod';
import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';
import { saying } from '@ValenceI18n/saying';
import { compareReleases } from './compareReleases';
import type { UpdateChecker } from './UpdateChecker';

const LATEST_RELEASE = 'https://api.github.com/repos/ValenceOSS/Valence/releases/latest';

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

const ReleaseSchema = z.object({
  tag_name: z.string(),
  published_at: z.string().datetime().nullable(),
  body: z.string().nullable(),
  html_url: z.string().url(),
});

type CreateUpdateCheckerOptions = {
  current: string;
  isEnabled: boolean;
  fetchRelease?: () => Promise<Response>;
  now?: () => Date;
};

/**
 * Asks GitHub which release of Valence is newest, at most every six hours, so the admin area can say
 * when this server is behind. Nothing about the server is sent, and a server told not to check never
 * asks.
 *
 * @param current - The release this server runs.
 * @param isEnabled - Whether to ask at all.
 * @param fetchRelease - How to ask for the newest release.
 * @param now - The clock.
 * @returns The checker.
 */
const createUpdateChecker = ({
  current,
  isEnabled,
  fetchRelease = () =>
    fetch(LATEST_RELEASE, {
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
    checkedAt: null,
    isEnabled,
    problem: null,
  };
  let last = unknown;
  let lastAt = 0;

  const check = async (): Promise<UpdateCheck> => {
    const checkedAt = now();

    try {
      const answer = await fetchRelease();

      if (!answer.ok) {
        return {
          ...last,
          checkedAt: checkedAt.toISOString(),
          problem: saying('server.updates.createUpdateChecker.githubAnsweredStatus', {
            status: answer.status.toString(),
          }),
        };
      }

      const release = ReleaseSchema.parse(await answer.json());

      return {
        current,
        latest: release.tag_name.replace(/^v/, ''),
        isNewer: compareReleases(release.tag_name, current) > 0,
        publishedAt: release.published_at,
        notes: release.body,
        url: release.html_url,
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
