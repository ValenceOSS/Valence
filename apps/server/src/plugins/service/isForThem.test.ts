import { describe, expect, it } from 'vitest';
import { isForThem } from './isForThem';
import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';

const AN_EVENT: PluginEvent = {
  topic: 'playback.finished',
  occurredAt: '2026-10-24T00:00:00.000Z',
  profileId: 'p1',
  mediaId: 'm1',
  positionSeconds: null,
  durationSeconds: null,
};

const USED_BY = new Set(['p1']);

const ACCOUNTS = new Set(['a1']);

describe('isForThem', () => {
  it('tells a plugin about a profile only where that profile used it', () => {
    expect(isForThem(AN_EVENT, USED_BY, ACCOUNTS)).toBe(true);
    expect(isForThem({ ...AN_EVENT, profileId: 'p2' }, USED_BY, ACCOUNTS)).toBe(false);
  });

  it('tells a plugin about an account only where somebody on it used the plugin', () => {
    const arrived = { ...AN_EVENT, topic: 'requests.available', profileId: null };

    expect(isForThem({ ...arrived, accountId: 'a1' }, USED_BY, ACCOUNTS)).toBe(true);
    expect(isForThem({ ...arrived, accountId: 'a2' }, USED_BY, ACCOUNTS)).toBe(false);
  });

  it('tells every plugin of what is about nobody, and of a removed profile', () => {
    expect(
      isForThem({ ...AN_EVENT, topic: 'media.added', profileId: null }, USED_BY, ACCOUNTS),
    ).toBe(true);
    expect(
      isForThem({ ...AN_EVENT, topic: 'profile.removed', profileId: 'p9' }, USED_BY, ACCOUNTS),
    ).toBe(true);
  });
});
