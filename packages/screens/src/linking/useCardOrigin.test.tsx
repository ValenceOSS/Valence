import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useCardOrigin } from './useCardOrigin';

const LIGHT = aLinkedServerFace({ name: 'films', colour: '#f5e663' });
const DARK = aLinkedServerFace({ id: '00000000-0000-4000-8000-000000000002', colour: '#1a2b6d' });

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () =>
    Promise.resolve([
      aLibrary({ id: 'mine' }),
      aLibrary({ id: 'light', linkedServerId: LIGHT.id }),
      aLibrary({ id: 'dark', linkedServerId: DARK.id }),
    ]),
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
}));

vi.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () => Promise.resolve([LIGHT, DARK]),
}));

describe('useCardOrigin', () => {
  it('marks a card from a linked server with its initial and colour, in ink that reads on it', async () => {
    const { result } = renderHookInACache(() => useCardOrigin());

    await waitFor(() => {
      expect(result.current('light').origin).toBeDefined();
    });

    expect(result.current('light')).toEqual({
      origin: { initial: 'F', colour: '#f5e663', ink: 'dark', label: 'From films' },
    });
    expect(result.current('dark').origin?.ink).toBe('light');
  });

  it('spreads nothing onto a card of this server’s own', async () => {
    const { result } = renderHookInACache(() => useCardOrigin());

    await waitFor(() => {
      expect(result.current('light').origin).toBeDefined();
    });

    expect(result.current('mine')).toEqual({});
  });
});
