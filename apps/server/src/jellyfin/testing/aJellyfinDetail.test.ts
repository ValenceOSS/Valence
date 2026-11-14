import { describe, expect, it } from 'vitest';
import { aJellyfinDetail } from './aJellyfinDetail';
import { aJellyfinFilm } from './aJellyfinFilm';

describe('aJellyfinDetail', () => {
  it('describes the file behind a summary, with a track and a subtitle', () => {
    expect(aJellyfinDetail(aJellyfinFilm())).toMatchObject({
      title: 'Sneakers',
      container: 'mkv',
      audioStreams: [{ codec: 'aac' }],
      subtitleStreams: [{ format: 'srt' }],
    });
  });
});
