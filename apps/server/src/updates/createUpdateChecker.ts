import { z } from 'zod';
import type { DevBuildCheck } from '@ValenceContracts/schemas/DevBuildCheck';
import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';
import { saying } from '@ValenceI18n/saying';
import { compareReleases } from './compareReleases';
import { checkDevBuild } from './checkDevBuild';
import { devCommitOf } from './devCommitOf';
import { fetchDevImage as askTheRegistry } from './fetchDevImage';
import { rateLimitedUntil } from './rateLimitedUntil';
import type { UpdateChecker } from './UpdateChecker';

const GITHUB = 'https://api.github.com/repos/ValenceOSS/Valence';

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

const DEV_CHECK_EVERY_MS = 60 * 60 * 1000;

const FORCED_AT_MOST_EVERY_MS = 60 * 1000;

const ASK_GITHUB = { accept: 'application/vnd.github+json' };

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
  fetchDevImage?: () => Promise<Response>;
  fetchComparison?: (from: string, to: string) => Promise<Response>;
  fetchCommits?: (from: string, count: number) => Promise<Response>;
  now?: () => Date;
};

/**
 * Asks GitHub for the recent releases of Valence, at most every six hours, and for a dev build also,
 * every hour, how far it is behind the image the `dev` tag points at, holding off while GitHub asks
 * it to wait.
 *
 * @param current - The release this server runs.
 * @param isEnabled - Whether to ask at all.
 * @param fetchReleases - How to ask for the recent releases, newest first.
 * @param fetchDevImage - How to ask the container registry what the `dev` tag points at.
 * @param fetchComparison - How to ask GitHub how one commit stands against another, without files.
 * @param fetchCommits - How to ask GitHub for the newest commits up to and including one.
 * @param now - The clock.
 * @returns The checker.
 */
const createUpdateChecker = ({
  current,
  isEnabled,
  fetchReleases = () =>
    fetch(`${GITHUB}/releases?per_page=15`, {
      headers: ASK_GITHUB,
      signal: AbortSignal.timeout(10_000),
    }),
  fetchDevImage = () => askTheRegistry(AbortSignal.timeout(10_000)),
  fetchComparison = (from, to) =>
    fetch(`${GITHUB}/compare/${from}...${to}?per_page=100&page=2`, {
      headers: ASK_GITHUB,
      signal: AbortSignal.timeout(10_000),
    }),
  fetchCommits = (from, count) =>
    fetch(`${GITHUB}/commits?sha=${from}&per_page=${count.toString()}`, {
      headers: ASK_GITHUB,
      signal: AbortSignal.timeout(10_000),
    }),
  now = () => new Date(),
}: CreateUpdateCheckerOptions): UpdateChecker => {
  const devCommit = devCommitOf(current);
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
    dev: null,
  };
  let releases = unknown;
  let releasesAt = 0;
  let dev: DevBuildCheck | null = null;
  let devAt = 0;
  let waitUntil = 0;

  const heed = (answer: Response): Response => {
    waitUntil = Math.max(waitUntil, rateLimitedUntil(answer, now().getTime()) ?? 0);

    return answer;
  };

  const askReleases = async () => heed(await fetchReleases());
  const askComparison = async (from: string, to: string) => heed(await fetchComparison(from, to));
  const askCommits = async (from: string, count: number) => heed(await fetchCommits(from, count));

  const checkReleases = async (): Promise<UpdateCheck> => {
    const checkedAt = now().toISOString();

    try {
      const answer = await askReleases();

      if (!answer.ok) {
        return {
          ...releases,
          checkedAt,
          problem: saying('server.updates.createUpdateChecker.githubAnsweredStatus', {
            status: answer.status.toString(),
          }),
        };
      }

      const history = ReleasesSchema.parse(await answer.json())
        .filter((release) => !release.draft && !release.prerelease)
        .map((release) => {
          const against = compareReleases(release.tag_name, current);

          return {
            version: release.tag_name.replace(/^v/, ''),
            publishedAt: release.published_at,
            notes: release.body,
            url: release.html_url,
            isNewer: against > 0 || (against === 0 && devCommit !== null),
            isCurrent: against === 0 && devCommit === null,
          };
        });
      const [latest] = history;

      return {
        current,
        latest: latest?.version ?? null,
        isNewer: latest?.isNewer ?? false,
        publishedAt: latest?.publishedAt ?? null,
        notes: latest?.notes ?? null,
        url: latest?.url ?? null,
        history,
        checkedAt,
        isEnabled,
        problem: null,
        dev: null,
      };
    } catch {
      return {
        ...releases,
        checkedAt,
        problem: saying('server.updates.createUpdateChecker.githubCouldNotBeReached'),
      };
    }
  };

  const checkDev = async (commit: string): Promise<DevBuildCheck> => {
    try {
      const fresh = await checkDevBuild({
        commit,
        fetchDevImage,
        fetchComparison: askComparison,
        fetchCommits: askCommits,
      });

      return fresh.problem === null || dev === null ? fresh : { ...dev, problem: fresh.problem };
    } catch {
      return {
        ...(dev ?? {
          commit,
          newest: null,
          builtAt: null,
          isNewer: false,
          isOffMain: false,
          behindBy: 0,
          commits: [],
        }),
        problem: saying('server.updates.checkDevBuild.githubCouldNotBeReached'),
      };
    }
  };

  const isDue = (at: number, everyMs: number, isForced: boolean) => {
    const since = now().getTime() - at;

    return at === 0 || since >= everyMs || (isForced && since >= FORCED_AT_MOST_EVERY_MS);
  };

  return {
    read: async (isForced = false) => {
      if (!isEnabled) {
        return unknown;
      }

      if (now().getTime() < waitUntil) {
        return {
          ...releases,
          dev,
          problem: saying('server.updates.createUpdateChecker.githubAskedToWait', {
            time: `${new Date(waitUntil).toISOString().slice(11, 16)} UTC`,
          }),
        };
      }

      const [freshReleases, freshDev] = await Promise.all([
        isDue(releasesAt, CHECK_EVERY_MS, isForced) ? checkReleases() : null,
        devCommit !== null && isDue(devAt, DEV_CHECK_EVERY_MS, isForced)
          ? checkDev(devCommit)
          : null,
      ]);

      if (freshReleases !== null) {
        releases = freshReleases;
        releasesAt = now().getTime();
      }

      if (freshDev !== null) {
        dev = freshDev;
        devAt = now().getTime();
      }

      return { ...releases, dev };
    },
  };
};

export type { CreateUpdateCheckerOptions };

export { createUpdateChecker };
