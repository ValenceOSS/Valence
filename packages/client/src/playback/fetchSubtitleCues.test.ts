import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSubtitleCues, subtitleCuesUrl } from './fetchSubtitleCues';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';

const A_CUE = {
  from: 1,
  to: 2,
  spans: [
    {
      text: 'CLOSED',
      fontFamily: 'Impact',
      fontHeight: 0.0667,
      colour: '#ff0000',
      opacity: 1,
      isBold: true,
      isItalic: false,
      isUnderlined: false,
      isStruckThrough: false,
    },
  ],
  alignment: 7,
  position: { x: 0.75, y: 0.2 },
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const answers = (body: string | object, status = 200) => {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('the address a track’s styled lines are asked for', () => {
  it('asks the track for its lines', () => {
    expect(subtitleCuesUrl('film', 'track')).toBe('/api/media/film/subtitles/track/cues?from=0');
  });

  it('says how far in the stream begins, in whole seconds', () => {
    expect(subtitleCuesUrl('film', 'track', 92.7)).toContain('from=92');
  });

  it('never asks for a negative start, which is not a place in a film', () => {
    expect(subtitleCuesUrl('film', 'track', -30)).toContain('from=0');
  });
});

describe('reading a track as styled lines', () => {
  it('reads the lines where the track has them', async () => {
    answers({ cues: [A_CUE] });

    const cues = await fetchSubtitleCues('/cues');

    expect(cues?.[0]?.spans[0]?.text).toBe('CLOSED');
    expect(cues?.[0]?.isSign).toBe(true);
  });

  it('answers with nothing where the track carries no styling', async () => {
    answers({ error: 'no' }, 404);

    await expect(fetchSubtitleCues('/cues')).resolves.toBeNull();
  });

  it('answers with nothing where the script has no line in it, so the plain track is read', async () => {
    answers({ cues: [] });

    await expect(fetchSubtitleCues('/cues')).resolves.toBeNull();
  });

  it('throws where the server could not read the track just now, so it is asked again', async () => {
    answers({ error: 'later' }, 503);

    await expect(fetchSubtitleCues('/cues')).rejects.toThrow(RequestFailed);
  });

  it('throws where the server cannot be reached, rather than taking that for no styling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchSubtitleCues('/cues')).rejects.toThrow('offline');
  });

  it('refuses an answer that is not the shape it asked for', async () => {
    answers({ cues: [{ from: 'soon' }] });

    await expect(fetchSubtitleCues('/cues')).resolves.toBeNull();
  });

  it('refuses an answer that is not JSON at all', async () => {
    answers('<html>a proxy’s page</html>');

    await expect(fetchSubtitleCues('/cues')).resolves.toBeNull();
  });

  it('hands the request what tells it the lines are no longer wanted', async () => {
    const fetchMock = answers({ cues: [A_CUE] });
    const stop = new AbortController();

    await fetchSubtitleCues('/cues', stop.signal);

    expect(fetchMock).toHaveBeenCalledWith('/cues', { signal: stop.signal });
  });
});
