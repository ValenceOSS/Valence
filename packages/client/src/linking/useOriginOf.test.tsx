import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useOriginOf } from './useOriginOf';

const FILMS = aLinkedServerFace({ name: 'films' });

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
  fetchLibraries: () =>
    Promise.resolve([
      aLibrary({ id: 'mine' }),
      aLibrary({ id: 'theirs', linkedServerId: FILMS.id }),
      aLibrary({ id: 'lost', linkedServerId: 'gone' }),
    ]),
}));

vi.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () => Promise.resolve([FILMS]),
}));

describe('useOriginOf', () => {
  it('names the server a linked library comes from, by its initial and colour', async () => {
    const { result } = renderHookInACache(() => useOriginOf());

    await waitFor(() => {
      expect(result.current('theirs')).not.toBeNull();
    });

    expect(result.current('theirs')).toEqual({
      ...FILMS,
      initial: 'F',
      label: 'From films',
    });
  });

  it('answers nothing for this server’s own, or for a server it does not know', async () => {
    const { result } = renderHookInACache(() => useOriginOf());

    await waitFor(() => {
      expect(result.current('theirs')).not.toBeNull();
    });

    expect(result.current('mine')).toBeNull();
    expect(result.current('lost')).toBeNull();
    expect(result.current('nowhere')).toBeNull();
  });
});
