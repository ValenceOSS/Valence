import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useSubtitleSearch } from './useSubtitleSearch';
import type { Kept } from '@ValenceClient/library/keepFoundSubtitle';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';

const { fetchSubtitleSetup, findSubtitles, keepFoundSubtitle } = vi.hoisted(() => ({
  fetchSubtitleSetup: vi.fn(),
  findSubtitles: vi.fn(),
  keepFoundSubtitle: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchSubtitleSetup', () => ({ fetchSubtitleSetup }));
vi.mock('@ValenceClient/library/findSubtitles', () => ({ findSubtitles }));
vi.mock('@ValenceClient/library/keepFoundSubtitle', () => ({ keepFoundSubtitle }));

const FOUND: FoundSubtitle = {
  source: 'subdl',
  id: '9',
  name: 'Arrival.2016.1080p',
  language: 'fr',
  isExactMatch: false,
  isHearingImpaired: false,
  isMachineTranslated: false,
  frameRate: null,
  downloads: null,
  score: 80,
  reasons: [],
};

beforeEach(() => {
  fetchSubtitleSetup.mockReset().mockResolvedValue({ languages: ['fr', 'en'] });
  findSubtitles.mockReset().mockResolvedValue({ subtitles: [FOUND], isSetUp: true });
  keepFoundSubtitle.mockReset();
});

describe('useSubtitleSearch', () => {
  it('asks nothing of the sites until the search is open', () => {
    renderHookInACache(() => useSubtitleSearch('m1', [], false));

    expect(findSubtitles).not.toHaveBeenCalled();
    expect(fetchSubtitleSetup).not.toHaveBeenCalled();
  });

  it('looks in the server’s first language, offering its languages before the rest', async () => {
    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));

    await waitFor(() => {
      expect(result.current.found.data?.subtitles).toEqual([FOUND]);
    });

    expect(result.current.language).toBe('fr');
    expect(findSubtitles).toHaveBeenCalledWith('m1', 'fr');
    expect(result.current.languages.slice(0, 2).map((one) => one.code)).toEqual(['fr', 'en']);
    expect(new Set(result.current.languages.map((one) => one.code)).size).toBe(
      result.current.languages.length,
    );
  });

  it('looks in English where the server names no language of its own', async () => {
    fetchSubtitleSetup.mockRejectedValue(new Error('403'));

    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));

    await waitFor(() => {
      expect(findSubtitles).toHaveBeenCalledWith('m1', 'en');
    });

    expect(result.current.language).toBe('en');
  });

  it('asks the sites nothing until the server says which language to look in first', () => {
    fetchSubtitleSetup.mockReturnValue(new Promise(() => undefined));

    renderHookInACache(() => useSubtitleSearch('m1', [], true));

    expect(findSubtitles).not.toHaveBeenCalled();
  });

  it('takes one subtitle at a time', async () => {
    let finish: (kept: Kept) => void = () => undefined;

    keepFoundSubtitle.mockReturnValue(
      new Promise<Kept>((resolve) => {
        finish = resolve;
      }),
    );

    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));
    let second: Kept | null | undefined;

    await act(async () => {
      const first = result.current.take(FOUND);

      second = await result.current.take(FOUND);
      finish({ kind: 'kept', tracks: [], fresh: null });
      await first;
    });

    expect(second).toBeNull();
    expect(keepFoundSubtitle).toHaveBeenCalledTimes(1);
  });

  it('looks again in a language chosen', async () => {
    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));

    act(() => {
      result.current.choose('de');
    });

    await waitFor(() => {
      expect(findSubtitles).toHaveBeenCalledWith('m1', 'de');
    });
  });

  it('takes a subtitle in the language looked in, and hands back what was kept', async () => {
    const kept: Kept = { kind: 'kept', tracks: [], fresh: null };

    keepFoundSubtitle.mockResolvedValue(kept);

    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));

    await waitFor(() => {
      expect(result.current.language).toBe('fr');
    });

    let answer: Kept | null | undefined;

    await act(async () => {
      answer = await result.current.take(FOUND);
    });

    expect(answer).toEqual(kept);
    expect(keepFoundSubtitle).toHaveBeenCalledWith(
      'm1',
      { source: 'subdl', id: '9', language: 'fr' },
      [],
    );
    expect(result.current.taking).toBeNull();
    expect(result.current.problem).toBeNull();
  });

  it('holds on to why a subtitle could not be kept, until the language changes', async () => {
    keepFoundSubtitle.mockResolvedValue({ kind: 'refused', problem: 'No key is saved.' });

    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));

    await act(async () => {
      await result.current.take(FOUND);
    });

    expect(result.current.problem).toBe('No key is saved.');

    act(() => {
      result.current.choose('en');
    });

    expect(result.current.problem).toBeNull();
  });

  it('hands back nothing, and says so, where the server could not be reached', async () => {
    keepFoundSubtitle.mockRejectedValue(new Error('offline'));

    const { result } = renderHookInACache(() => useSubtitleSearch('m1', [], true));
    let answer: Kept | null | undefined;

    await act(async () => {
      answer = await result.current.take(FOUND);
    });

    expect(answer).toBeNull();
    expect(result.current.problem).toBe('Couldn’t reach the server.');
  });
});
