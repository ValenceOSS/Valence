import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import type { StreamOffers } from '@ValenceContracts/schemas/StreamOffer';
import type { StreamPlayAnswer } from './playStream';
import type { Screen } from './pickStreamOffer';
import { usePlayFromSource } from './usePlayFromSource';

const { fetchStreamOffers, playStream } = vi.hoisted(() => ({
  fetchStreamOffers: vi.fn<(tmdbId: number, isFresh?: boolean) => Promise<StreamOffers>>(),
  playStream: vi.fn<(streamId: string) => Promise<StreamPlayAnswer>>(),
}));

vi.mock('./fetchStreamOffers', () => ({ fetchStreamOffers }));
vi.mock('./playStream', () => ({ playStream }));

const SCREEN: Screen = {
  maxHeight: 2160,
  showsHdr: true,
  playsCodec: () => true,
  runtimeMinutes: null,
};

const REFUSED: StreamPlayAnswer = {
  kind: 'refused',
  message: 'It is down.',
  problem: 'sourceUnreachable',
  isGone: false,
};

beforeEach(() => {
  fetchStreamOffers.mockReset().mockResolvedValue({
    offers: [
      aStreamOffer({ id: 'best', resolution: '2160p', sizeBytes: null }),
      aStreamOffer({ id: 'next' }),
    ],
    problems: [],
  });
  playStream.mockReset().mockResolvedValue({ kind: 'ready', mediaId: 'm1' });
});

describe('usePlayFromSource', () => {
  it('chooses the best stream and plays it', async () => {
    const onPlay = vi.fn();
    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith('m1');
    });
    expect(playStream).toHaveBeenCalledWith('best');
  });

  it('tries the next best once, quietly, when the one chosen will not start', async () => {
    const onPlay = vi.fn();

    playStream.mockResolvedValueOnce(REFUSED);

    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith('m1');
    });
    expect(playStream.mock.calls.map(([id]) => id)).toEqual(['best', 'next']);
  });

  it('never falls back behind somebody’s back from a stream they chose, and says why it failed', async () => {
    playStream.mockResolvedValue(REFUSED);

    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, vi.fn()));

    act(() => {
      result.current.choose('next');
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('It is down.');
    });
    expect(playStream).toHaveBeenCalledTimes(1);
  });

  it('opens the picker where nothing can start straight away, and says when no source has the film', async () => {
    fetchStreamOffers.mockResolvedValue({
      offers: [aStreamOffer({ isReady: false })],
      problems: [],
    });

    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, vi.fn()));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.isPickerOpen).toBe(true);
    });

    fetchStreamOffers.mockResolvedValue({ offers: [], problems: [] });

    const second = renderHookInACache(() => usePlayFromSource(604, SCREEN, vi.fn()));

    act(() => {
      second.result.current.start();
    });

    await waitFor(() => {
      expect(second.result.current.problem).toBe('No source has this film right now.');
    });
  });
});
