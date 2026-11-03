import { z } from 'zod';
import type { DevBuildCheck } from '@ValenceContracts/schemas/DevBuildCheck';
import { saying } from '@ValenceI18n/saying';

const SHOWN_COMMITS = 50;

const DevImageSchema = z.object({
  annotations: z.object({
    'org.opencontainers.image.revision': z.string(),
    'org.opencontainers.image.created': z.string().datetime().nullish(),
  }),
});

const ComparisonSchema = z.object({
  status: z.enum(['ahead', 'behind', 'diverged', 'identical']),
  ahead_by: z.number().int().nonnegative(),
});

const CommitsSchema = z.array(
  z.object({
    sha: z.string(),
    html_url: z.string().url(),
    commit: z.object({
      message: z.string(),
      committer: z.object({ date: z.string().datetime().nullable() }).nullable(),
    }),
  }),
);

type CheckDevBuildOptions = {
  commit: string;
  fetchDevImage: () => Promise<Response>;
  fetchComparison: (from: string, to: string) => Promise<Response>;
  fetchCommits: (from: string, count: number) => Promise<Response>;
};

/**
 * Says whether a development build is behind the image the `dev` tag points at, and which commits on
 * main it is missing, newest first.
 *
 * @param commit - The commit this build was made from.
 * @param fetchDevImage - How to ask the container registry what the `dev` tag points at.
 * @param fetchComparison - How to ask GitHub how one commit stands against another, without files.
 * @param fetchCommits - How to ask GitHub for the newest commits up to and including one.
 * @returns What was found, or the problem that stopped it being found.
 */
const checkDevBuild = async ({
  commit,
  fetchDevImage,
  fetchComparison,
  fetchCommits,
}: CheckDevBuildOptions): Promise<DevBuildCheck> => {
  const nothing: DevBuildCheck = {
    commit,
    newest: null,
    builtAt: null,
    isNewer: false,
    isOffMain: false,
    behindBy: 0,
    commits: [],
    problem: null,
  };

  const image = await fetchDevImage();

  if (!image.ok) {
    return {
      ...nothing,
      problem: saying('server.updates.checkDevBuild.theRegistryAnsweredStatus', {
        status: image.status.toString(),
      }),
    };
  }

  const { annotations } = DevImageSchema.parse(await image.json());
  const newest = annotations['org.opencontainers.image.revision'];
  const found = {
    ...nothing,
    newest: newest.slice(0, commit.length),
    builtAt: annotations['org.opencontainers.image.created'] ?? null,
  };

  if (newest.startsWith(commit)) {
    return found;
  }

  const compared = await fetchComparison(commit, newest);

  if (!compared.ok) {
    return {
      ...found,
      problem:
        compared.status === 404
          ? saying('server.updates.checkDevBuild.thisBuildIsNotOnGithub')
          : saying('server.updates.checkDevBuild.githubAnsweredStatus', {
              status: compared.status.toString(),
            }),
    };
  }

  const comparison = ComparisonSchema.parse(await compared.json());

  if (comparison.status === 'behind' || comparison.status === 'identical') {
    return { ...found, newest: commit, builtAt: null };
  }

  const isOffMain = comparison.status === 'diverged';

  if (comparison.ahead_by === 0) {
    return { ...found, isOffMain };
  }

  const listed = await fetchCommits(newest, Math.min(comparison.ahead_by, SHOWN_COMMITS));
  const commits = listed.ok ? CommitsSchema.parse(await listed.json()) : [];

  return {
    ...found,
    isNewer: true,
    isOffMain,
    behindBy: comparison.ahead_by,
    commits: commits.slice(0, comparison.ahead_by).map((one) => ({
      sha: one.sha.slice(0, commit.length),
      subject: one.commit.message.split('\n')[0] ?? '',
      committedAt: one.commit.committer?.date ?? null,
      url: one.html_url,
    })),
  };
};

export type { CheckDevBuildOptions };

export { checkDevBuild };
