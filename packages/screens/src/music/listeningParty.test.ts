import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readListeningParty, setListeningParty, useListeningParty } from './listeningParty';
import type { ListeningParty } from './listeningParty';

const PARTY: ListeningParty = {
  party: {
    id: 'p1',
    kind: 'listen',
    mediaId: 'song',
    createdAtMs: 0,
    everyoneMaySeek: false,
    everyoneMayPlayPause: false,
    hasPassword: false,
    isPlaying: true,
    isHeld: false,
    members: [],
    timekeeperId: null,
  },
  hostName: 'Dan',
  mayChoose: false,
  mayPlayPause: false,
  maySeek: false,
  send: vi.fn(),
};

afterEach(() => {
  setListeningParty(null);
});

describe('listeningParty', () => {
  it('is in no party to begin with', () => {
    const { result } = renderHook(() => useListeningParty());

    expect(result.current).toBeNull();
  });

  it('says which party this window joined wherever it is read', () => {
    const { result } = renderHook(() => useListeningParty());

    act(() => {
      setListeningParty(PARTY);
    });

    expect(result.current).toBe(PARTY);
    expect(readListeningParty()).toBe(PARTY);
  });
});
