import { waitFor } from '@testing-library/react';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLikeThis } from './useLikeThis';

const { fetchLikeThis, serverHas } = vi.hoisted(() => ({
  fetchLikeThis: vi.fn(),
  serverHas: vi.fn<() => boolean | null>(),
}));

vi.mock('@ValenceClient/library/fetchLikeThis', () => ({ fetchLikeThis }));
vi.mock('@ValenceClient/about/useServerHas', () => ({ useServerHas: serverHas }));

beforeEach(() => {
  fetchLikeThis.mockReset();
  fetchLikeThis.mockResolvedValue([{ id: 'contact' }]);
  serverHas.mockReset();
  serverHas.mockReturnValue(true);
});

describe('useLikeThis', () => {
  it('finds what is like a title', async () => {
    const { result } = renderHookInACache(() => useLikeThis('arrival'));

    await waitFor(() => {
      expect(result.current).toEqual([{ id: 'contact' }]);
    });
    expect(fetchLikeThis).toHaveBeenCalledWith('arrival');
  });

  it('asks nothing of a server that cannot say, or for no title', () => {
    serverHas.mockReturnValue(false);

    const { result } = renderHookInACache(() => useLikeThis('arrival'));
    const { result: nothing } = renderHookInACache(() => useLikeThis(null));

    expect(result.current).toEqual([]);
    expect(nothing.current).toEqual([]);
    expect(fetchLikeThis).not.toHaveBeenCalled();
  });
});
