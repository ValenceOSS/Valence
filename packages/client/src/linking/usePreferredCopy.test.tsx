import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { usePreferredCopy } from './usePreferredCopy';

const watcher = vi.hoisted(() => ({ prefersBestCopy: true }));

const FILMS = aLinkedServerFace();

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () =>
    Promise.resolve([
      aLibrary({ id: 'mine' }),
      aLibrary({ id: 'theirs', linkedServerId: FILMS.id }),
    ]),
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
}));

vi.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () => Promise.resolve([FILMS]),
}));

vi.mock('@ValenceClient/profiles/currentProfile', () => ({
  readCurrentProfile: () => 'profile-1',
}));

vi.mock('@ValenceClient/profiles/fetchProfiles', () => ({
  fetchProfiles: () =>
    Promise.resolve([
      {
        id: 'profile-1',
        name: 'Dan',
        colour: '#e8503a',
        avatar: { kind: 'initial', font: 'gilroy' },
        askStillWatchingAfter: 3,
        showsWhatIamWatching: false,
        prefersBestCopy: watcher.prefersBestCopy,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      },
    ]),
}));

const COPIES = [{ id: 'sharper', height: 2160, libraryId: 'theirs' }];

beforeEach(() => {
  watcher.prefersBestCopy = true;
});

describe('usePreferredCopy', () => {
  it('picks a sharper copy on a linked server for somebody who prefers the best', async () => {
    const { result } = renderHookInACache(() => usePreferredCopy({ height: 1080 }, COPIES));

    await waitFor(() => {
      expect(result.current).toBe('sharper');
    });
  });

  it('picks nothing for somebody who has not asked', async () => {
    watcher.prefersBestCopy = false;

    const { result } = renderHookInACache(() => usePreferredCopy({ height: 1080 }, COPIES));

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(result.current).toBeNull();
  });

  it('picks nothing while the title is still being read', () => {
    const { result } = renderHookInACache(() => usePreferredCopy(null, COPIES));

    expect(result.current).toBeNull();
  });
});
