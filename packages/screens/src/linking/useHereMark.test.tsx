import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useHereMark } from './useHereMark';
import type { ThisServerFace } from '@ValenceContracts/schemas/LinkSharing';

const VALENCE: ThisServerFace = { name: 'valence', colour: '#f5e663', pictureAt: null };

const here = vi.hoisted((): { face: ThisServerFace | null } => ({ face: null }));

vi.mock('@ValenceClient/linking/fetchThisServerFace', () => ({
  fetchThisServerFace: () => Promise.resolve(here.face),
}));

describe('useHereMark', () => {
  it('marks this server with its initial and colour, in ink that reads on it', async () => {
    here.face = VALENCE;
    const { result } = renderHookInACache(() => useHereMark());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toEqual({
      initial: 'V',
      colour: '#f5e663',
      ink: 'dark',
      label: 'From valence',
      pictureUrl: null,
    });
  });

  it('draws its picture where it has one', async () => {
    here.face = { name: 'Home', colour: '#1a2b6d', pictureAt: '2026-11-12' };
    const { result } = renderHookInACache(() => useHereMark());

    await waitFor(() => {
      expect(result.current?.pictureUrl).toBe('/api/linked-servers/identity/picture?v=2026-11-12');
    });
  });
});
