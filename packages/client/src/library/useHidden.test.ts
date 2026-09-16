import { act, waitFor } from '@testing-library/react';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHidden } from './useHidden';
import type { Hidden } from '@ValenceContracts/schemas/Hidden';
import type { HiddenSubject } from '@ValenceClient/library/fetchHidden';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const fetchHidden = vi.fn<() => Promise<Hidden[]>>();
const setHidden = vi.fn<(subject: HiddenSubject, isHidden: boolean) => Promise<boolean>>();

vi.mock('@ValenceClient/library/fetchHidden', () => ({
  fetchHidden: () => fetchHidden(),
  setHidden: (subject: HiddenSubject, isHidden: boolean) => setHidden(subject, isHidden),
}));

const FILM: HiddenSubject = { kind: 'item', subjectId: 'media-1' };

const summary = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'media-1',
  libraryId: 'library-1',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  parentId: null,
  extraKind: null,
  versionLabel: null,
  rating: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  genres: null,
  ...overrides,
});

/**
 * Presses hide and agrees to it, which is what a person does.
 */
const hideIt = (
  hiding: { ask: (media: MediaSummary) => void; confirm: () => void },
  media: MediaSummary,
) => {
  hiding.ask(media);
  hiding.confirm();
};

const anEntry = (): Hidden => ({
  kind: 'item',
  subjectId: 'media-1',
  title: 'Arrival',
  hiddenAt: '2026-09-16T00:00:00.000Z',
});

beforeEach(() => {
  fetchHidden.mockReset().mockResolvedValue([]);
  setHidden.mockReset().mockResolvedValue(true);
});

describe('what this viewer has hidden', () => {
  it('reads the whole list once rather than asking per item', async () => {
    fetchHidden.mockResolvedValue([anEntry()]);

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });
    expect(fetchHidden).toHaveBeenCalledTimes(1);
  });

  it('tells a film apart from a programme that happens to share an identifier', async () => {
    fetchHidden.mockResolvedValue([anEntry()]);

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });
    expect(result.current.isHidden({ kind: 'series', subjectId: 'media-1' })).toBe(false);
  });

  it('does not show one person what somebody else hid', async () => {
    fetchHidden.mockResolvedValue([anEntry()]);

    const { result, rerender } = renderHookInACache(({ who }: { who: string }) => useHidden(who), {
      initialProps: { who: 'dan' },
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });

    fetchHidden.mockResolvedValue([]);
    rerender({ who: 'kid' });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(false);
    });
  });

  it('asks for nobody’s list until it knows whose', () => {
    renderHookInACache(() => useHidden(null));

    expect(fetchHidden).not.toHaveBeenCalled();
  });
});

describe('hiding something', () => {
  it('takes it out of sight before the server has answered', async () => {
    setHidden.mockReturnValue(new Promise(() => {}));

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(fetchHidden).toHaveBeenCalled();
    });

    act(() => {
      hideIt(result.current, summary());
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });
  });

  it('puts it back where the server refuses', async () => {
    setHidden.mockResolvedValue(false);

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(fetchHidden).toHaveBeenCalled();
    });

    act(() => {
      hideIt(result.current, summary());
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(false);
    });
  });

  it('puts back only the one refused, not everything hidden since', async () => {
    setHidden.mockImplementation((subject) => Promise.resolve(subject.kind !== 'item'));

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(fetchHidden).toHaveBeenCalled();
    });

    act(() => {
      hideIt(result.current, summary());
      hideIt(result.current, summary({ id: 'e1', seriesId: 'series-1', seriesTitle: 'Curb' }));
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(false);
    });
    expect(result.current.isHidden({ kind: 'series', subjectId: 'series-1' })).toBe(true);
  });

  it('keeps both where two are hidden before either is answered', async () => {
    setHidden.mockReturnValue(new Promise(() => {}));

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(fetchHidden).toHaveBeenCalled();
    });

    act(() => {
      hideIt(result.current, summary());
      hideIt(result.current, summary({ id: 'e1', seriesId: 'series-1', seriesTitle: 'Curb' }));
    });

    await waitFor(() => {
      expect(result.current.isHidden({ kind: 'series', subjectId: 'series-1' })).toBe(true);
    });
    expect(result.current.isHidden(FILM)).toBe(true);
  });

  it('records the programme’s name, so a row can be drawn before the list is read again', async () => {
    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(fetchHidden).toHaveBeenCalled();
    });

    act(() => {
      hideIt(result.current, summary({ id: 'e1', seriesId: 'series-1', seriesTitle: 'Curb' }));
    });

    await waitFor(() => {
      expect(result.current.entries[0]).toMatchObject({ kind: 'series', title: 'Curb' });
    });
  });
});

describe('bringing something back', () => {
  it('returns it to view at once', async () => {
    fetchHidden.mockResolvedValue([anEntry()]);

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });

    act(() => {
      result.current.show(FILM);
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(false);
    });
    expect(setHidden).toHaveBeenCalledWith(FILM, false);
  });

  it('hides it again where the server refuses to bring it back', async () => {
    fetchHidden.mockResolvedValue([anEntry()]);
    setHidden.mockResolvedValue(false);

    const { result } = renderHookInACache(() => useHidden('watcher-1'));

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });

    act(() => {
      result.current.show(FILM);
    });

    await waitFor(() => {
      expect(result.current.isHidden(FILM)).toBe(true);
    });
  });
});
