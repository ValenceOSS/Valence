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
  isForbidden: false,
};

/**
 * Holds an answer back until the test lets it go.
 */
const heldBack = () => {
  let release: (answer: StreamPlayAnswer) => void = () => undefined;
  const answer = new Promise<StreamPlayAnswer>((resolve) => {
    release = resolve;
  });

  return { answer, release: (given: StreamPlayAnswer) => release(given) };
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

  it('tries no other stream of a film this viewer may not play', async () => {
    playStream.mockResolvedValueOnce({ ...REFUSED, message: 'Above your age.', isForbidden: true });

    const onPlay = vi.fn();
    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('Above your age.');
    });
    expect(playStream).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('tries the next best when the one chosen turns out still to be getting ready', async () => {
    playStream.mockResolvedValueOnce({ kind: 'preparing', progress: 0.1 });

    const onPlay = vi.fn();
    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith('m1');
    });
    expect(playStream.mock.calls.map(([id]) => id)).toEqual(['best', 'next']);
  });

  it('opens the picker, rather than saying nobody has the film, where a source could not say', async () => {
    fetchStreamOffers.mockResolvedValue({
      offers: [],
      problems: [{ code: 'x', message: 'Example files didn’t answer in time.', values: {} }],
    });

    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, vi.fn()));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.isPickerOpen).toBe(true);
    });
    expect(result.current.problem).toBeNull();
  });

  it('plays nothing for an attempt somebody walked away from', async () => {
    const held = heldBack();

    playStream.mockReturnValueOnce(held.answer);

    const onPlay = vi.fn();
    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.openPicker();
    });
    act(() => {
      result.current.choose('next');
    });
    act(() => {
      result.current.closePicker();
    });
    await act(async () => {
      held.release({ kind: 'ready', mediaId: 'late' });
      await held.answer;
    });

    expect(onPlay).not.toHaveBeenCalled();
    expect(result.current.isStarting).toBe(false);
  });

  it('starts afresh for another film, asking its sources nothing until asked', async () => {
    playStream.mockResolvedValue({ ...REFUSED, message: 'Nope.' });

    const { result, rerender } = renderHookInACache(
      ({ tmdbId }: { tmdbId: number }) => usePlayFromSource(tmdbId, SCREEN, vi.fn()),
      { initialProps: { tmdbId: 603 } },
    );

    act(() => {
      result.current.choose('next');
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('Nope.');
    });

    fetchStreamOffers.mockClear();
    rerender({ tmdbId: 604 });

    expect(result.current.problem).toBeNull();
    expect(result.current.isPickerOpen).toBe(false);
    expect(fetchStreamOffers).not.toHaveBeenCalled();
  });

  it('stops waiting on Play once somebody chooses for themselves, or closes the picker', async () => {
    const held = heldBack();

    fetchStreamOffers.mockReturnValueOnce(
      held.answer.then(() => ({ offers: [aStreamOffer({ id: 'best' })], problems: [] })),
    );

    const onPlay = vi.fn();
    const { result } = renderHookInACache(() => usePlayFromSource(603, SCREEN, onPlay));

    act(() => {
      result.current.start();
    });

    expect(result.current.isFinding).toBe(true);

    act(() => {
      result.current.openPicker();
    });
    act(() => {
      result.current.closePicker();
    });

    expect(result.current.isFinding).toBe(false);

    await act(async () => {
      held.release({ kind: 'ready', mediaId: 'late' });
      await held.answer;
    });

    expect(result.current.isFinding).toBe(false);
    expect(onPlay).not.toHaveBeenCalled();
  });
});
