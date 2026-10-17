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
});
