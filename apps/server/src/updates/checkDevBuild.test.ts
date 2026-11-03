import { describe, expect, it, vi } from 'vitest';
import { checkDevBuild } from './checkDevBuild';

const answering = (body: object, status = 200) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

const DEV_TAG = {
  annotations: {
    'org.opencontainers.image.revision': 'c3c3c3c3c3c3c3c3c3c3',
    'org.opencontainers.image.created': '2026-11-03T14:34:41.229Z',
  },
};

const aCommit = (sha: string, message: string) => ({
  sha,
  html_url: `https://github.com/ValenceOSS/Valence/commit/${sha}`,
  commit: { message, committer: { date: '2026-11-03T12:00:00Z' } },
});

describe('checkDevBuild', () => {
  it('says a build is current where the dev tag points at it, without asking GitHub', async () => {
    const fetchComparison = answering({});

    expect(
      await checkDevBuild({
        commit: 'c3c3c3c',
        fetchDevImage: answering(DEV_TAG),
        fetchComparison,
        fetchCommits: answering([]),
      }),
    ).toMatchObject({ newest: 'c3c3c3c', isNewer: false, behindBy: 0, commits: [] });
    expect(fetchComparison).not.toHaveBeenCalled();
  });

  it('lists what the newer dev build has, newest first, asking for no more than it is behind', async () => {
    const fetchCommits = answering([
      aCommit('c3c3c3c3c3', 'feat: the newer change (#2)'),
      aCommit('b2b2b2b2b2', 'fix: the older change (#1)\n\nWhy it changed'),
      aCommit('a1a1a1a1a1', 'this build itself'),
    ]);

    const checked = await checkDevBuild({
      commit: 'a1a1a1a',
      fetchDevImage: answering(DEV_TAG),
      fetchComparison: answering({ status: 'ahead', ahead_by: 2 }),
      fetchCommits,
    });

    expect(fetchCommits).toHaveBeenCalledWith('c3c3c3c3c3c3c3c3c3c3', 2);
    expect(checked).toMatchObject({
      newest: 'c3c3c3c',
      builtAt: '2026-11-03T14:34:41.229Z',
      isNewer: true,
      isOffMain: false,
      behindBy: 2,
      problem: null,
    });
    expect(checked.commits.map((one) => [one.sha, one.subject])).toEqual([
      ['c3c3c3c', 'feat: the newer change (#2)'],
      ['b2b2b2b', 'fix: the older change (#1)'],
    ]);
  });

  it('is not behind where it is newer than the dev tag, which may still be building', async () => {
    expect(
      await checkDevBuild({
        commit: 'd4d4d4d',
        fetchDevImage: answering(DEV_TAG),
        fetchComparison: answering({ status: 'behind', ahead_by: 0 }),
        fetchCommits: answering([]),
      }),
    ).toMatchObject({ newest: 'd4d4d4d', builtAt: null, isNewer: false, behindBy: 0 });
  });

  it('says where a build has commits of its own that main does not', async () => {
    expect(
      await checkDevBuild({
        commit: 'e5e5e5e',
        fetchDevImage: answering(DEV_TAG),
        fetchComparison: answering({ status: 'diverged', ahead_by: 1 }),
        fetchCommits: answering([aCommit('c3c3c3c3c3', 'feat: on main (#3)')]),
      }),
    ).toMatchObject({ isNewer: true, isOffMain: true, behindBy: 1 });
  });

  it('says where a build is not on GitHub at all, rather than guessing', async () => {
    const checked = await checkDevBuild({
      commit: 'f6f6f6f',
      fetchDevImage: answering(DEV_TAG),
      fetchComparison: answering({ message: 'Not Found' }, 404),
      fetchCommits: answering([]),
    });

    expect(checked.isNewer).toBe(false);
    expect(checked.problem?.code).toBe('server.updates.checkDevBuild.thisBuildIsNotOnGithub');
  });

  it('says what the registry answered where it would not say what the dev tag is', async () => {
    const checked = await checkDevBuild({
      commit: 'a1a1a1a',
      fetchDevImage: answering({}, 503),
      fetchComparison: answering({}),
      fetchCommits: answering([]),
    });

    expect(checked.problem?.code).toBe('server.updates.checkDevBuild.theRegistryAnsweredStatus');
  });

  it('still says how far behind it is where the commits could not be listed', async () => {
    expect(
      await checkDevBuild({
        commit: 'a1a1a1a',
        fetchDevImage: answering(DEV_TAG),
        fetchComparison: answering({ status: 'ahead', ahead_by: 4 }),
        fetchCommits: answering({}, 500),
      }),
    ).toMatchObject({ isNewer: true, behindBy: 4, commits: [] });
  });
});
