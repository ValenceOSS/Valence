import { describe, expect, it } from 'vitest';
import { renderHookInAnAddress } from '@ValenceScreens/testing/renderHookInAnAddress';
import { useLikedSongsTile } from './useLikedSongsTile';

describe('useLikedSongsTile', () => {
  it('names the liked songs and draws them a cover', () => {
    const { result } = renderHookInAnAddress(() => useLikedSongsTile());

    expect(result.current.title).toBe('Liked Songs');
    expect(result.current.artwork).not.toBeNull();
  });
});
