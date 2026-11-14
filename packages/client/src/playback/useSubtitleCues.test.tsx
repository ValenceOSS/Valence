import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { useSubtitleCues } from './useSubtitleCues';
import type { SubtitleTrack } from './fetchSubtitles';

const MEDIA_ID = 'film';

const PLAIN = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nPlain line\n';

const A_STYLED_CUE = {
  from: 1,
  to: 2,
  spans: [
    {
      text: 'Styled line',
      fontFamily: 'Arial',
      fontHeight: 0.05,
      colour: '#ffffff',
      opacity: 1,
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      isStruckThrough: false,
    },
  ],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
};

const aTrack = (format: string, id = `${format}-track`): SubtitleTrack => ({
  id,
  language: 'en',
  label: 'English',
  format,
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: 2,
});

type Answer = { status: number; body?: string | object } | 'hold' | 'unreachable';

const answering = (answers: { styled?: Answer[]; plain?: Answer[] }) => {
  const asked = { styled: 0, plain: 0 };
  const answerOf = (answer: Answer | undefined): Promise<Response> => {
    if (answer === 'hold') {
      return new Promise<Response>(() => undefined);
    }

    if (answer === 'unreachable') {
      return Promise.reject(new TypeError('Network request failed'));
    }

    const { status, body } = answer ?? { status: 404 };

    return Promise.resolve(
      typeof body === 'object'
        ? Response.json(body, { status })
        : new Response(body ?? '', { status }),
    );
  };

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const kind = url.includes('/cues') ? 'styled' : 'plain';
      const list = answers[kind] ?? [];
      const answer = list[Math.min(asked[kind], list.length - 1)];

      asked[kind] += 1;

      return answerOf(answer);
    }),
  );

  return asked;
};

const linesOf = (cues: { spans: { text: string }[] }[]) =>
  cues.map((cue) => cue.spans.map((span) => span.text).join(''));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSubtitleCues', () => {
  it('reads a plain track as WebVTT, without asking it for styling it cannot have', async () => {
    const asked = answering({ plain: [{ status: 200, body: PLAIN }] });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('srt')), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Plain line']);
    });

    expect(asked.styled).toBe(0);
  });

  it('draws a script’s own lines', async () => {
    answering({
      styled: [{ status: 200, body: { cues: [A_STYLED_CUE] } }],
      plain: [{ status: 200, body: PLAIN }],
    });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('ass')), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Styled line']);
    });
  });

  it('draws a script’s plain lines while its own are on their way', async () => {
    answering({ styled: ['hold'], plain: [{ status: 200, body: PLAIN }] });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('ass')), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Plain line']);
    });
  });

  it('draws a script’s plain lines where it has no styled form', async () => {
    answering({ styled: [{ status: 404 }], plain: [{ status: 200, body: PLAIN }] });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('ass')), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Plain line']);
    });
  });

  it('asks again where the server could not read the track, rather than drawing nothing', async () => {
    const asked = answering({
      plain: [{ status: 503 }, 'unreachable', { status: 200, body: PLAIN }],
    });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('srt')), {
      wrapper: CacheScope,
    });

    await waitFor(
      () => {
        expect(linesOf(result.current)).toEqual(['Plain line']);
      },
      { timeout: 5000 },
    );

    expect(asked.plain).toBe(3);
  });

  it('draws a script’s own lines once a failed read of them succeeds', async () => {
    answering({
      styled: [{ status: 503 }, { status: 200, body: { cues: [A_STYLED_CUE] } }],
      plain: [{ status: 200, body: PLAIN }],
    });
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, aTrack('ass')), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Plain line']);
    });

    await waitFor(
      () => {
        expect(linesOf(result.current)).toEqual(['Styled line']);
      },
      { timeout: 5000 },
    );
  });

  it('draws nothing and asks for nothing where no track is being read', () => {
    const asked = answering({});
    const { result } = renderHook(() => useSubtitleCues(MEDIA_ID, null), { wrapper: CacheScope });

    expect(result.current).toEqual([]);
    expect(asked).toEqual({ styled: 0, plain: 0 });
  });

  it('never draws one track’s lines while another is being read', async () => {
    answering({ plain: [{ status: 200, body: PLAIN }, 'hold'] });
    const { result, rerender } = renderHook(
      ({ track }: { track: SubtitleTrack }) => useSubtitleCues(MEDIA_ID, track),
      { wrapper: CacheScope, initialProps: { track: aTrack('srt', 'first') } },
    );

    await waitFor(() => {
      expect(linesOf(result.current)).toEqual(['Plain line']);
    });

    rerender({ track: aTrack('srt', 'second') });

    expect(result.current).toEqual([]);
  });
});
