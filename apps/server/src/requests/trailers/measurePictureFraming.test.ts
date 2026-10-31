import { describe, expect, it, vi } from 'vitest';
import { measurePictureFraming } from './measurePictureFraming';

const MASTER = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=198356,CODECS="avc1.4D4015,mp4a.40.5",RESOLUTION=426x240,AUDIO="233"
https://manifest.googlevideo.com/240
#EXT-X-STREAM-INF:BANDWIDTH=997206,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=1280x720,AUDIO="234"
https://manifest.googlevideo.com/720
#EXT-X-STREAM-INF:BANDWIDTH=420317,CODECS="avc1.4D401E,mp4a.40.2",RESOLUTION=640x360,AUDIO="234"
https://manifest.googlevideo.com/360
`;

/**
 * A YouTube that answers with the given playlist.
 *
 * @param text - The playlist.
 * @returns The fetch it answers.
 */
const aPlaylist = (text: string) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(text, { status: 200 })));

describe('measurePictureFraming', () => {
  it('measures the bars on the smallest picture of at least 360 lines, as most frames are', async () => {
    const run = vi.fn((_ffmpeg: string, _args: readonly string[]) =>
      Promise.resolve(
        [
          'crop=640:272:0:44',
          'crop=640:360:0:0',
          'crop=88:40:216:138',
          'crop=640:272:0:44',
          'crop=640:272:0:44',
        ].join('\n'),
      ),
    );

    expect(
      await measurePictureFraming(
        'https://manifest.googlevideo.com/master',
        'ffmpeg',
        aPlaylist(MASTER),
        run,
      ),
    ).toEqual({ wide: 640, high: 360, top: 44, left: 0, right: 0, bottom: 44 });
    expect(run.mock.lastCall?.[1]).toContain('https://manifest.googlevideo.com/360');
  });

  it('measures nothing where ffmpeg says nothing of the picture', async () => {
    const run = vi.fn((_ffmpeg: string, _args: readonly string[]) =>
      Promise.resolve('No such file'),
    );

    expect(
      await measurePictureFraming(
        'https://manifest.googlevideo.com/master',
        'ffmpeg',
        aPlaylist(MASTER),
        run,
      ),
    ).toBeNull();
  });

  it('measures nothing where there is no picture large enough to measure', async () => {
    const run = vi.fn((_ffmpeg: string, _args: readonly string[]) =>
      Promise.resolve('crop=1:1:0:0'),
    );

    expect(
      await measurePictureFraming(
        'https://manifest.googlevideo.com/master',
        'ffmpeg',
        aPlaylist('#EXTM3U\n'),
        run,
      ),
    ).toBeNull();
    expect(run).not.toHaveBeenCalled();
  });
});
