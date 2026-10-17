import { describe, expect, it, vi } from 'vitest';
import { createUpdateChecker } from './createUpdateChecker';

const RELEASE = {
  tag_name: 'v1.7.0',
  published_at: '2026-10-10T12:00:00Z',
  body: 'What changed',
  html_url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.7.0',
};

const answering = (body: object, status = 200) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('createUpdateChecker', () => {
  it('says a newer release is out', async () => {
    const checker = createUpdateChecker({
      current: '1.6.0',
      isEnabled: true,
      fetchRelease: answering(RELEASE),
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
    const fetchRelease = answering(RELEASE);
    const checker = createUpdateChecker({
      current: '1.7.0',
      isEnabled: true,
      fetchRelease,
      now: () => at,
    });

    await checker.read();
    at = new Date('2026-10-17T01:00:00Z');
    await checker.read();
    expect(fetchRelease).toHaveBeenCalledTimes(1);

    await checker.read(true);
    at = new Date('2026-10-17T08:00:00Z');
    await checker.read();
    expect(fetchRelease).toHaveBeenCalledTimes(3);
  });

  it('never asks when told not to check', async () => {
    const fetchRelease = answering(RELEASE);
    const checker = createUpdateChecker({ current: '1.6.0', isEnabled: false, fetchRelease });

    expect(await checker.read(true)).toMatchObject({ isEnabled: false, latest: null });
    expect(fetchRelease).not.toHaveBeenCalled();
  });

  it('keeps what it last knew when GitHub cannot be reached, and says so', async () => {
    const checker = createUpdateChecker({
      current: '1.6.0',
      isEnabled: true,
      fetchRelease: () => Promise.reject(new Error('offline')),
    });

    const read = await checker.read();

    expect(read.latest).toBeNull();
    expect(read.problem?.code).toBe('server.updates.createUpdateChecker.githubCouldNotBeReached');
  });
});
