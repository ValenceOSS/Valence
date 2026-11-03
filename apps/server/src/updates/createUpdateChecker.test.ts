import { describe, expect, it, vi } from 'vitest';
import { createUpdateChecker } from './createUpdateChecker';

const RELEASE = {
  tag_name: 'v1.7.0',
  published_at: '2026-10-10T12:00:00Z',
  body: 'What changed',
  html_url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.7.0',
};

const answering = (body: object | object[], status = 200) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('createUpdateChecker', () => {
  it('says a newer release is out', async () => {
    const checker = createUpdateChecker({
      current: '1.6.0',
      isEnabled: true,
      fetchReleases: answering([RELEASE]),
    });

    expect(await checker.read()).toMatchObject({
      current: '1.6.0',
      latest: '1.7.0',
      isNewer: true,
      notes: 'What changed',
      problem: null,
    });
  });

  it('asks again only once six hours have passed, unless told to', async () => {
    let at = new Date('2026-10-17T00:00:00Z');
    const fetchReleases = answering([RELEASE]);
    const checker = createUpdateChecker({
      current: '1.7.0',
      isEnabled: true,
      fetchReleases,
      now: () => at,
    });

    await checker.read();
    at = new Date('2026-10-17T01:00:00Z');
    await checker.read();
    expect(fetchReleases).toHaveBeenCalledTimes(1);

    await checker.read(true);
    at = new Date('2026-10-17T08:00:00Z');
    await checker.read();
    expect(fetchReleases).toHaveBeenCalledTimes(3);
  });

  it('never asks when told not to check', async () => {
    const fetchReleases = answering([RELEASE]);
    const checker = createUpdateChecker({ current: '1.6.0', isEnabled: false, fetchReleases });

    expect(await checker.read(true)).toMatchObject({ isEnabled: false, latest: null });
    expect(fetchReleases).not.toHaveBeenCalled();
  });

  it('keeps what it last knew when GitHub cannot be reached, and says so', async () => {
    const checker = createUpdateChecker({
      current: '1.6.0',
      isEnabled: true,
      fetchReleases: () => Promise.reject(new Error('offline')),
    });

    const read = await checker.read();

    expect(read.latest).toBeNull();
    expect(read.problem?.code).toBe('server.updates.createUpdateChecker.githubCouldNotBeReached');
  });

  it('keeps what changed in each recent release, leaving drafts and pre-releases out', async () => {
    const checker = createUpdateChecker({
      current: '1.6.0',
      isEnabled: true,
      fetchReleases: answering([
        { ...RELEASE, tag_name: 'v1.8.0-beta.1', prerelease: true },
        RELEASE,
        {
          ...RELEASE,
          tag_name: 'v1.6.0',
          body: 'Older',
          html_url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.6.0',
        },
      ]),
    });

    const read = await checker.read();

    expect([
      read.latest,
      read.history.map((release) => [release.version, release.isNewer]),
    ]).toEqual([
      '1.7.0',
      [
        ['1.7.0', true],
        ['1.6.0', false],
      ],
    ]);
  });

  describe('on a dev build', () => {
    const DEV_TAG = {
      annotations: {
        'org.opencontainers.image.revision': 'c3c3c3c3c3c3c3c3c3c3',
        'org.opencontainers.image.created': '2026-11-03T14:34:41.229Z',
      },
    };

    const devChecker = (overrides: Partial<Parameters<typeof createUpdateChecker>[0]> = {}) =>
      createUpdateChecker({
        current: '1.7.0-dev.a1a1a1a',
        isEnabled: true,
        fetchReleases: answering([RELEASE]),
        fetchDevImage: answering(DEV_TAG),
        fetchComparison: answering({ status: 'ahead', ahead_by: 1 }),
        fetchCommits: answering([
          {
            sha: 'c3c3c3c3c3',
            html_url: 'https://github.com/ValenceOSS/Valence/commit/c3c3c3c3c3',
            commit: { message: 'feat: a change (#9)', committer: { date: null } },
          },
        ]),
        ...overrides,
      });

    it('says the release it was building towards is out, as well as how far behind dev it is', async () => {
      const read = await devChecker().read();

      expect(read).toMatchObject({ latest: '1.7.0', isNewer: true });
      expect(read.history[0]).toMatchObject({ isNewer: true, isCurrent: false });
      expect(read.dev).toMatchObject({ newest: 'c3c3c3c', isNewer: true, behindBy: 1 });
    });

    it('checks the dev tag every hour, and the releases still only every six', async () => {
      let at = new Date('2026-11-03T00:00:00Z');
      const fetchReleases = answering([RELEASE]);
      const fetchDevImage = answering(DEV_TAG);
      const checker = devChecker({ fetchReleases, fetchDevImage, now: () => at });

      await checker.read();
      at = new Date('2026-11-03T01:00:00Z');
      await checker.read();

      expect(fetchDevImage).toHaveBeenCalledTimes(2);
      expect(fetchReleases).toHaveBeenCalledTimes(1);
    });

    it('checks again when asked at most once a minute, however often it is asked', async () => {
      let at = new Date('2026-11-03T00:00:00Z');
      const fetchDevImage = answering(DEV_TAG);
      const checker = devChecker({ fetchDevImage, now: () => at });

      await checker.read();
      await checker.read(true);
      await checker.read(true);
      expect(fetchDevImage).toHaveBeenCalledTimes(1);

      at = new Date('2026-11-03T00:01:00Z');
      await checker.read(true);
      expect(fetchDevImage).toHaveBeenCalledTimes(2);
    });

    it('holds off until GitHub says it may ask again, and says when that is', async () => {
      let at = new Date('2026-11-03T15:00:00Z');
      const fetchReleases = vi.fn(() =>
        Promise.resolve(
          new Response('{}', {
            status: 403,
            headers: {
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': (Date.parse('2026-11-03T15:30:00Z') / 1000).toString(),
            },
          }),
        ),
      );
      const checker = devChecker({ fetchReleases, now: () => at });

      await checker.read();
      at = new Date('2026-11-03T15:10:00Z');
      const waiting = await checker.read(true);

      expect(fetchReleases).toHaveBeenCalledTimes(1);
      expect(waiting.problem?.code).toBe('server.updates.createUpdateChecker.githubAskedToWait');
      expect(waiting.problem?.values).toMatchObject({ time: '15:30 UTC' });
    });

    it('asks again as soon as the wait is over, rather than hours later', async () => {
      let at = new Date('2026-11-03T15:00:00Z');
      let isLimited = true;
      const fetchReleases = vi.fn(() =>
        Promise.resolve(
          isLimited
            ? new Response('{}', {
                status: 403,
                headers: {
                  'x-ratelimit-remaining': '0',
                  'x-ratelimit-reset': (Date.parse('2026-11-03T15:30:00Z') / 1000).toString(),
                },
              })
            : new Response(JSON.stringify([RELEASE])),
        ),
      );
      const checker = devChecker({ fetchReleases, now: () => at });

      await checker.read();
      isLimited = false;
      at = new Date('2026-11-03T15:31:00Z');
      const read = await checker.read();

      expect(fetchReleases).toHaveBeenCalledTimes(2);
      expect(read).toMatchObject({ latest: '1.7.0', problem: null });
    });
  });

  it('never asks about dev builds on a release', async () => {
    const fetchDevImage = answering({});
    const read = await createUpdateChecker({
      current: '1.7.0',
      isEnabled: true,
      fetchReleases: answering([RELEASE]),
      fetchDevImage,
    }).read();

    expect(read.dev).toBeNull();
    expect(read.history[0]).toMatchObject({ isNewer: false, isCurrent: true });
    expect(fetchDevImage).not.toHaveBeenCalled();
  });
});
