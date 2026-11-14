import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aJellyfinServer } from './testing/aJellyfinServer';

const PlaybackSchema = z.object({
  PlaySessionId: z.string(),
  MediaSources: z.array(
    z.object({
      SupportsDirectPlay: z.boolean(),
      TranscodingUrl: z.string().optional(),
      DirectStreamUrl: z.string().optional(),
    }),
  ),
});

describe('registerJellyfinPlayback', () => {
  it('play a file the app can take as it is directly', async () => {
    const { post, ask, film, recorded } = aJellyfinServer();
    const id = film.id.replaceAll('-', '');
    const info = PlaybackSchema.parse(
      await (
        await post(`/Items/${id}/PlaybackInfo`, {
          DeviceProfile: {
            DirectPlayProfiles: [
              { Container: 'mkv', Type: 'Video', VideoCodec: 'h264', AudioCodec: 'aac' },
            ],
          },
        })
      ).json(),
    );
    const stream = await ask(`/Videos/${id}/stream?static=true`);

    expect(recorded.started).toEqual([film.id]);
    expect(info.MediaSources[0]?.SupportsDirectPlay).toBe(true);
    expect(info.MediaSources[0]?.DirectStreamUrl).toContain(`/Videos/${id}/stream`);
    expect(stream.status).toBe(206);
    expect(stream.headers.get('content-range')).toBe('bytes 0-4/100');
    expect(stream.headers.get('x-secret')).toBeNull();
  });

  it('hand an app that cannot take the file a stream behind a ticket, readable without a token', async () => {
    const { post, ask, film } = aJellyfinServer();
    const id = film.id.replaceAll('-', '');
    const info = PlaybackSchema.parse(
      await (
        await post(`/Items/${id}/PlaybackInfo`, {
          DeviceProfile: { DirectPlayProfiles: [{ Container: 'mp4', Type: 'Video' }] },
        })
      ).json(),
    );
    const url = info.MediaSources[0]?.TranscodingUrl ?? '';

    expect(url).toBe(`/Videos/${id}/hls/aTicket/index.m3u8`);
    expect(await (await ask(url, { token: null })).text()).toBe('#EXTM3U index.m3u8');
    expect((await ask(`/Videos/${id}/hls/notTheTicket/index.m3u8`, { token: null })).status).toBe(
      404,
    );
  });

  it('refuse to play what the viewer cannot reach', async () => {
    const { post } = aJellyfinServer();

    expect((await post(`/Items/${'f'.repeat(32)}/PlaybackInfo`, {})).status).toBe(404);
  });
});
