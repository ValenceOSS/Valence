import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchSubtitleCues } from '@ValenceClient/playback/fetchSubtitleCues';
import { useTheSubtitles } from './useTheSubtitles';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';

jest.mock('@ValenceClient/playback/fetchSubtitleCues', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/fetchSubtitleCues'),
  fetchSubtitleCues: jest.fn(),
}));

const asking = jest.fn<Promise<Response>, [string]>();

const aSpan = (text: string, colour: string | null = null): SubtitleSpan => ({
  text,
  colour,
  fontFamily: null,
  fontHeight: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
});

const aCue = (text: string): SubtitleCue => ({
  from: 0,
  to: 2,
  spans: [aSpan(text)],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

beforeEach(() => {
  jest.mocked(fetchSubtitleCues).mockReset().mockResolvedValue(null);
  asking.mockReset().mockResolvedValue(new Response(''));
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: asking });
});

describe('useTheSubtitles', () => {
  it('reads nothing while subtitles are off', async () => {
    const held = await renderHook(() => useTheSubtitles('a-film', 'off', false));

    expect(held.result.current).toEqual([]);
    expect(fetchSubtitleCues).not.toHaveBeenCalled();
  });

  it('reads nothing for a track the server is drawing into the picture itself', async () => {
    await renderHook(() => useTheSubtitles('a-film', 'one', true));

    expect(fetchSubtitleCues).not.toHaveBeenCalled();
  });

  it('asks for the styled form first, which keeps where a sign was put', async () => {
    jest.mocked(fetchSubtitleCues).mockResolvedValue([aCue('styled')]);

    const held = await renderHook(() => useTheSubtitles('a-film', 'one', false));

    await waitFor(() => {
      expect(held.result.current[0]?.spans[0]?.text).toBe('styled');
    });

    expect(asking).not.toHaveBeenCalled();
  });

  it('falls back to plain text, which is what most tracks are', async () => {
    asking.mockResolvedValue(new Response('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nplain\n'));

    const held = await renderHook(() => useTheSubtitles('a-film', 'one', false));

    await waitFor(() => {
      expect(held.result.current[0]?.spans[0]?.text).toBe('plain');
    });
  });

  it('reads nothing where neither form could be had', async () => {
    asking.mockResolvedValue(new Response('', { status: 404 }));

    const held = await renderHook(() => useTheSubtitles('a-film', 'one', false));

    await waitFor(() => {
      expect(held.result.current).toEqual([]);
    });
  });

  it('carries on where the server could not be reached at all', async () => {
    asking.mockRejectedValue(new Error('gone'));

    const held = await renderHook(() => useTheSubtitles('a-film', 'one', false));

    await waitFor(() => {
      expect(held.result.current).toEqual([]);
    });
  });

  it('asks for the whole track, since the player keeps the film’s own time wherever it started', async () => {
    jest.mocked(fetchSubtitleCues).mockResolvedValue([aCue('styled')]);

    await renderHook(() => useTheSubtitles('a-film', 'one', false));

    await waitFor(() => {
      expect(jest.mocked(fetchSubtitleCues).mock.calls[0]?.[0]).toContain('from=0');
    });
  });
});
