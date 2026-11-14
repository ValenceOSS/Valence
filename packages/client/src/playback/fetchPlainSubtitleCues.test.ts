import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { fetchPlainSubtitleCues } from './fetchPlainSubtitleCues';

const TRACK = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello there\n';

afterEach(() => {
  vi.unstubAllGlobals();
});

const answers = (body: string, status = 200) => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(body, { status })));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('fetchPlainSubtitleCues', () => {
  it('reads a track as lines dressed in nothing', async () => {
    answers(TRACK);

    const cues = await fetchPlainSubtitleCues('film', 'track');

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({ from: 1, to: 2, isSign: false });
    expect(cues[0]?.spans[0]?.text).toBe('Hello there');
  });

  it('asks the track’s own address, from the start of the film', async () => {
    const fetchMock = answers(TRACK);

    await fetchPlainSubtitleCues('film', 'track');

    expect(fetchMock).toHaveBeenCalledWith('/api/media/film/subtitles/track?from=0', {});
  });

  it('reads a track the server has nothing for as no lines', async () => {
    answers('', 404);

    await expect(fetchPlainSubtitleCues('film', 'track')).resolves.toEqual([]);
  });

  it('throws where the server could not read the track just now', async () => {
    answers('', 503);

    await expect(fetchPlainSubtitleCues('film', 'track')).rejects.toThrow(RequestFailed);
  });

  it('throws where the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(fetchPlainSubtitleCues('film', 'track')).rejects.toThrow('offline');
  });

  it('hands the request what tells it the lines are no longer wanted', async () => {
    const fetchMock = answers(TRACK);
    const stop = new AbortController();

    await fetchPlainSubtitleCues('film', 'track', stop.signal);

    expect(fetchMock).toHaveBeenCalledWith('/api/media/film/subtitles/track?from=0', {
      signal: stop.signal,
    });
  });
});
