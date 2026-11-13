import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useIsHere } from './useIsHere';

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () =>
    Promise.resolve([aLibrary({ id: 'mine' }), aLibrary({ id: 'theirs', linkedServerId: 's1' })]),
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
}));

describe('useIsHere', () => {
  it('knows this server’s own libraries from those shared by a linked one', async () => {
    const { result } = renderHookInACache(() => useIsHere());

    await waitFor(() => {
      expect(result.current('mine')).toBe(true);
    });

    expect(result.current('theirs')).toBe(false);
  });

  it('takes nothing it does not know for this server’s own', () => {
    const { result } = renderHookInACache(() => useIsHere());

    expect(result.current('mine')).toBe(false);
    expect(result.current('unheard-of')).toBe(false);
  });
});
