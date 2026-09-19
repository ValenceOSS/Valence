import { afterEach, describe, expect, it, vi } from 'vitest';
import { addProfile, changeProfile, fetchProfiles, removeProfile } from './fetchProfiles';

const PROFILE = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'HD',
  kind: 'video',
  resolutions: ['1080p'],
  sources: ['bluray'],
  musicQualities: [],
  smallestMb: null,
  largestMb: null,
  preferredWords: [],
  requiredWords: [],
  bannedWords: [],
  isUpgrading: false,
  upgradeUntilResolution: null,
  upgradeUntilSource: null,
  upgradeUntilMusicQuality: null,
  libraryIds: [],
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProfiles', () => {
  it('reads, adds, changes and removes profiles', async () => {
    answering([PROFILE]);

    expect(await fetchProfiles()).toEqual([PROFILE]);

    const kept = answering(PROFILE, 201);

    expect((await addProfile({ name: 'HD', kind: 'video' })).value).toEqual(PROFILE);
    expect((await changeProfile(PROFILE.id, { name: 'UHD' })).value).toEqual(PROFILE);

    const removed = answering(null, 204);

    expect(await removeProfile(PROFILE.id)).toBeNull();
    expect(
      [...kept.mock.calls, ...removed.mock.calls].map(
        ([path, init]) => `${init?.method ?? 'GET'} ${path}`,
      ),
    ).toEqual([
      'POST /api/admin/requests/profiles',
      `PATCH /api/admin/requests/profiles/${PROFILE.id}`,
      `DELETE /api/admin/requests/profiles/${PROFILE.id}`,
    ]);
  });
});
