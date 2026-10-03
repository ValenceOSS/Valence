import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useAskableAlong } from './useAskableAlong';

const fetchEveryone = vi.fn(() => Promise.resolve([{ id: 'dan', name: 'Dan', colour: '#e8503a' }]));
const fetchAskableElsewhere = vi.fn(() =>
  Promise.resolve([{ id: 'peer~films~kai', name: 'Kai from Films' }]),
);

vi.mock('@ValenceClient/profiles/fetchEveryone', () => ({
  fetchEveryone: () => fetchEveryone(),
}));

vi.mock('@ValenceClient/linking/fetchAskableElsewhere', () => ({
  fetchAskableElsewhere: () => fetchAskableElsewhere(),
}));

describe('useAskableAlong', () => {
  it('names the household here, then the people from linked servers', async () => {
    const { result } = renderHookInACache(() => useAskableAlong(true));

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    expect(result.current).toEqual([
      { id: 'dan', name: 'Dan' },
      { id: 'peer~films~kai', name: 'Kai from Films' },
    ]);
  });

  it('reads nobody while there is no party to ask them to', () => {
    fetchEveryone.mockClear();
    fetchAskableElsewhere.mockClear();

    const { result } = renderHookInACache(() => useAskableAlong(false));

    expect(result.current).toEqual([]);
    expect(fetchEveryone).not.toHaveBeenCalled();
    expect(fetchAskableElsewhere).not.toHaveBeenCalled();
  });
});
