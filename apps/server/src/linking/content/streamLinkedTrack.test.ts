import { describe, expect, it } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { streamLinkedTrack } from './streamLinkedTrack';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const SONG = '00000000-0000-4000-8000-0000000000b1';

const AT = { serverId: FILMS, route: `/api/media/${SONG}` };

const streaming = () =>
  aLinkedAskerAnswering(
    () =>
      new Response(new Uint8Array([1, 2]), {
        status: 206,
        headers: { 'content-type': 'audio/flac', 'content-range': 'bytes 0-1/10' },
      }),
  );

describe('streamLinkedTrack', () => {
  it('asks for the song at the quality this server would have sent, with the range', async () => {
    const asker = streaming();
    const streamed = await streamLinkedTrack(
      asker,
      AT,
      { kind: 'encoded', kbps: 320 },
      'bytes=0-1',
    );

    expect(asker.asked[0]?.route).toBe(`/api/music/tracks/${SONG}/stream?quality=high`);
    expect(asker.asked[0]?.asking.headers?.get('range')).toBe('bytes=0-1');
    expect(streamed).toMatchObject({
      status: 206,
      contentType: 'audio/flac',
      contentRange: 'bytes 0-1/10',
    });
  });

  it('asks for the original as lossless, and an encoding it does not know as normal', async () => {
    const asker = streaming();

    await streamLinkedTrack(asker, AT, { kind: 'original' }, null);
    await streamLinkedTrack(asker, AT, { kind: 'encoded', kbps: 96 }, null);

    expect(asker.asked.map((one) => one.route.split('=')[1])).toEqual(['lossless', 'low']);
    expect(asker.asked[0]?.asking.headers?.has('range')).toBe(false);
  });

  it('streams nothing for a route that names no song, or a song that is not there', async () => {
    expect(
      await streamLinkedTrack(
        streaming(),
        { serverId: FILMS, route: '/api/other' },
        { kind: 'original' },
        null,
      ),
    ).toBeNull();
    expect(
      await streamLinkedTrack(
        aLinkedAskerAnswering(() => new Response(null, { status: 404 })),
        AT,
        { kind: 'original' },
        null,
      ),
    ).toBeNull();
  });
});
