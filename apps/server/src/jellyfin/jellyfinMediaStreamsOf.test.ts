import { describe, expect, it } from 'vitest';
import { jellyfinMediaStreamsOf } from './jellyfinMediaStreamsOf';
import { aJellyfinDetail } from './testing/aJellyfinDetail';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('jellyfinMediaStreamsOf', () => {
  it('numbers the picture nought and every other stream one past Valence’s', () => {
    expect(
      jellyfinMediaStreamsOf(aJellyfinDetail(aJellyfinFilm())).map((stream) => [
        stream.Type,
        stream.Index,
        stream.Codec,
      ]),
    ).toEqual([
      ['Video', 0, 'h264'],
      ['Audio', 2, 'aac'],
      ['Subtitle', 3, 'subrip'],
    ]);
  });

  it('names each stream as the track menus show it', () => {
    const [video, audio, subtitle] = jellyfinMediaStreamsOf(aJellyfinDetail(aJellyfinFilm()));

    expect(video?.DisplayTitle).toBe('1080p - H264 - SDR');
    expect(audio).toMatchObject({
      DisplayTitle: 'eng - AAC - stereo',
      Channels: 2,
      Language: 'eng',
    });
    expect(subtitle).toMatchObject({ IsTextSubtitleStream: true, Language: 'eng' });
  });
});
