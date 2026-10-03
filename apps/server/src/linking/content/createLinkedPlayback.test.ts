import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { aDeviceProfile } from '@ValenceServer/testing/aDeviceProfile';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { createLinkedPlayback } from './createLinkedPlayback';
import type { PlaybackService } from '@ValenceServer/playback/PlaybackService';
import type { Asking } from './createLinkedAsker';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const HERE = '00000000-0000-4000-8000-0000000000a1';

const THERE = '00000000-0000-4000-8000-0000000000b1';

const SESSION = `linked~${FILMS}~s1`;

const reason: Reason = { code: 'ClientSupportsSource', detail: sayVerbatim('It plays') };

const plan: PlaybackPlan = {
  mediaId: THERE,
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const STARTED = {
  sessionId: 's1',
  delivery: { kind: 'hls', manifestUrl: '/api/playback/session/s1/index.m3u8' },
  mode: 'Transcode',
  plan,
  warnings: [],
  reuse: null,
};

/**
 * This server's own playback, which plays nothing of a linked server's.
 *
 * @returns The playback.
 */
const aLocal = () => ({
  explain: vi.fn<PlaybackService['explain']>(() => Promise.resolve(null)),
  start: vi.fn<PlaybackService['start']>(() => Promise.resolve({ kind: 'notFound' })),
  readSessionFile: vi.fn<PlaybackService['readSessionFile']>(() => Promise.resolve(null)),
  readDirectFile: vi.fn<PlaybackService['readDirectFile']>(() => Promise.resolve(null)),
  trickplay: vi.fn<PlaybackService['trickplay']>(() => Promise.resolve(null)),
  readFrame: vi.fn<PlaybackService['readFrame']>(() => Promise.resolve(null)),
  readPreview: vi.fn<PlaybackService['readPreview']>(() => Promise.resolve({ kind: 'absent' })),
  readTrickplayFile: vi.fn<PlaybackService['readTrickplayFile']>(() => Promise.resolve(null)),
  stop: vi.fn<PlaybackService['stop']>(() => Promise.resolve(true)),
  heartbeat: vi.fn<PlaybackService['heartbeat']>(() => Promise.resolve(true)),
});

/**
 * Films, answering for its title `THERE`: starting it, its files, its thumbnails, a ticket for
 * playing straight from it, and an admin who has asked somebody to pause.
 *
 * @param route - What was asked for.
 * @param asking - How.
 * @returns The answer.
 */
const films = (route: string, asking: Asking): Response | null => {
  if (route === `/api/playback/${THERE}/session`) {
    return Response.json(STARTED);
  }

  if (route === '/direct') {
    return Response.json({ ticket: 'a-ticket' });
  }

  if (route.endsWith('/heartbeat')) {
    return Response.json({ asks: [{ kind: 'paused', reason: 'Bedtime' }] });
  }

  if (route === `/api/playback/${THERE}/trickplay`) {
    return Response.json({
      id: 't1',
      url: '/api/playback/trickplay/t1/sheet.jpg',
      intervalSeconds: 10,
      tileWidth: 320,
      tileHeight: 180,
    });
  }

  if (asking.method === 'DELETE') {
    return new Response(null, { status: 204 });
  }

  return new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'video/mp2t' } });
};

/**
 * Playback over this server's own, where `HERE` is Films' `THERE`.
 *
 * @param answer - How Films answers.
 * @param directFrom - Where players reach Films, where they play straight from it.
 * @returns The playback, this server's own, what Films was asked and what its admin asked of whom.
 */
const playback = (
  answer: (route: string, asking: Asking) => Response | null = films,
  directFrom: string | null = null,
) => {
  const local = aLocal();
  const asker = aLinkedAskerAnswering((_, route, asking) => answer(route, asking));
  const onAsked = vi.fn();
  const linked = createLinkedPlayback(
    local,
    (mediaId) => Promise.resolve(mediaId === HERE ? { serverId: FILMS, remoteId: THERE } : null),
    asker,
    onAsked,
    () => Promise.resolve(directFrom),
  );

  return { linked, local, asker, onAsked };
};

describe('createLinkedPlayback', () => {
  it('plays this server’s own titles as it always has', async () => {
    const { linked, local, asker } = playback();

    await linked.start('mine', aDeviceProfile(), 0);
    await linked.readSessionFile('own-session', 'index.m3u8');
    await linked.stop('own-session');

    expect(local.start).toHaveBeenCalledOnce();
    expect(local.readSessionFile).toHaveBeenCalledWith('own-session', 'index.m3u8');
    expect(local.stop).toHaveBeenCalledOnce();
    expect(asker.asked).toEqual([]);
  });

  it('starts a linked title on its server, under a name and addresses of this server’s own', async () => {
    const { linked, asker } = playback();
    const started = await linked.start(HERE, aDeviceProfile(), 12.7);

    expect(started).toMatchObject({
      kind: 'started',
      session: {
        sessionId: SESSION,
        delivery: {
          kind: 'hls',
          manifestUrl: `/api/playback/session/${encodeURIComponent(SESSION)}/index.m3u8`,
        },
        plan: { mediaId: HERE },
      },
    });
    expect(asker.asked[0]?.route).toBe(`/api/playback/${THERE}/session`);
    expect(JSON.parse(new TextDecoder().decode(asker.asked[0]?.asking.body))).toMatchObject({
      startSeconds: 12,
    });
  });

  it('hands players the linked server’s own address, where they play straight from it', async () => {
    const { linked } = playback(films, 'https://films.example');

    expect(await linked.start(HERE, aDeviceProfile(), 0)).toMatchObject({
      session: {
        sessionId: SESSION,
        delivery: {
          kind: 'hls',
          manifestUrl: 'https://films.example/api/federation/v1/direct/a-ticket/index.m3u8',
        },
      },
    });
  });

  it('says a linked title is not there, or why its server would not play it', async () => {
    const gone = playback(() => new Response(null, { status: 404 }));
    const busy = playback(() =>
      Response.json(
        { error: 'Too many.', code: 'error.linking.yourServerIsPlayingAsMuchAsItMay', values: {} },
        { status: 429 },
      ),
    );
    const away = playback(() => null);

    expect(await gone.linked.start(HERE, aDeviceProfile(), 0)).toEqual({ kind: 'notFound' });
    expect(await busy.linked.start(HERE, aDeviceProfile(), 0)).toMatchObject({
      kind: 'unsupported',
      reason: { code: 'error.linking.yourServerIsPlayingAsMuchAsItMay' },
    });
    expect(await away.linked.start(HERE, aDeviceProfile(), 0)).toMatchObject({ kind: 'failed' });
  });

  it('reads a linked session’s files from its server, and stops it there', async () => {
    const { linked, asker } = playback();

    expect(await linked.readSessionFile(SESSION, 'segment 1.ts')).toMatchObject({
      contentType: 'video/mp2t',
    });
    expect(await linked.stop(SESSION)).toBe(true);
    expect(asker.asked.map((one) => one.route)).toEqual([
      '/api/playback/session/s1/segment%201.ts',
      '/api/playback/session/s1',
    ]);
  });

  it('passes on what the linked server’s admin asked of the device playing', async () => {
    const { linked, onAsked } = playback();

    await linked.start(HERE, aDeviceProfile(), 0, undefined, undefined, 'the-phone');

    expect(await linked.heartbeat(SESSION, true)).toBe(true);
    expect(onAsked).toHaveBeenCalledWith('the-phone', FILMS, [
      { kind: 'paused', reason: 'Bedtime' },
    ]);
  });

  it('names a linked title’s thumbnails as this server’s own', async () => {
    const { linked } = playback();
    const thumbnails = await linked.trickplay(HERE);
    const named = `linked~${FILMS}~t1`;

    expect(thumbnails).toMatchObject({
      id: named,
      url: `/api/playback/trickplay/${encodeURIComponent(named)}/sheet.jpg`,
    });
    expect(await linked.readTrickplayFile(named, 'sheet.jpg')).toMatchObject({
      contentType: 'video/mp2t',
    });
  });

  it('reads a linked title’s file with the range asked for, and a frame of it', async () => {
    const { linked, asker } = playback();

    expect(await linked.readDirectFile(HERE, 'bytes=0-1', null)).toMatchObject({ status: 200 });
    expect(await linked.readFrame(HERE, 30, 320)).toBeInstanceOf(ArrayBuffer);
    expect(asker.asked[0]?.asking.headers?.get('range')).toBe('bytes=0-1');
    expect(asker.asked[1]?.route).toBe(`/api/playback/${THERE}/frame?seconds=30&width=320`);
  });

  it('says a linked title’s preview is still being made, or that there is none', async () => {
    expect(
      await playback(() => new Response(null, { status: 202 })).linked.readPreview(HERE, null),
    ).toEqual({ kind: 'pending' });
    expect(await playback(() => null).linked.readPreview(HERE, null)).toEqual({
      kind: 'absent',
    });
  });
});
