import { describe, expect, it, vi } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { linkedRenditions } from './linkedRenditions';
import type { Renditions } from './linkedRenditions';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const ARRIVAL = '00000000-0000-4000-8000-0000000000a1';

const LINKED_ID = `linked~${FILMS}~${ARRIVAL}`;

const aRequestFor = (inputPath: string) => ({
  spec: {
    inputPath,
    startSeconds: 0,
    segmentSeconds: 6,
    hardwareAccel: 'none',
    video: { kind: 'copy' as const },
    audio: { kind: 'copy' as const },
  },
  durationSeconds: 60,
  audioStreamIndexes: [],
  subtitleStreamIndexes: [],
  generation: 1,
});

const aLocal = (): Renditions => ({
  requestDownload: vi.fn(() =>
    Promise.resolve({ id: 'here', isReady: false, progress: 0, file: 'original', sizeBytes: null }),
  ),
  readDownloadFile: vi.fn(() => Promise.resolve(null)),
  forgetDownload: vi.fn(() => Promise.resolve(true)),
  stopDownload: vi.fn(() => Promise.resolve(true)),
});

describe('linkedRenditions', () => {
  it('makes this server’s own downloads as it always has', async () => {
    const local = aLocal();
    const renditions = linkedRenditions(
      local,
      aLinkedAskerAnswering(() => null),
    );

    expect((await renditions.requestDownload(aRequestFor('/films/Arrival.mkv'))).id).toBe('here');
    await renditions.forgetDownload('here');
    await renditions.stopDownload('here');

    expect(local.forgetDownload).toHaveBeenCalledWith('here');
    expect(local.stopDownload).toHaveBeenCalledWith('here');
  });

  it('has a linked title’s original ready at once, and makes nothing of it here', async () => {
    const local = aLocal();
    const renditions = linkedRenditions(
      local,
      aLinkedAskerAnswering(() => null),
    );
    const asked = await renditions.requestDownload(
      aRequestFor(`linked://${FILMS}/api/media/${ARRIVAL}`),
    );

    expect(asked).toEqual({
      id: LINKED_ID,
      isReady: true,
      progress: 100,
      file: 'original',
      sizeBytes: null,
    });
    expect(local.requestDownload).not.toHaveBeenCalled();
    expect(await renditions.forgetDownload(LINKED_ID)).toBe(true);
    expect(await renditions.stopDownload(LINKED_ID)).toBe(true);
    expect(local.forgetDownload).not.toHaveBeenCalled();
  });

  it('reads a linked title’s file from the server that has it, with the range asked for', async () => {
    const asker = aLinkedAskerAnswering(
      () =>
        new Response(new Uint8Array([1]), {
          status: 206,
          headers: { 'content-type': 'video/x-matroska', 'content-length': '1' },
        }),
    );
    const read = await linkedRenditions(aLocal(), asker).readDownloadFile(
      LINKED_ID,
      'original',
      'bytes=0-0',
    );

    expect(asker.asked[0]).toMatchObject({
      serverId: FILMS,
      route: `/api/playback/${ARRIVAL}/file`,
    });
    expect(asker.asked[0]?.asking.headers?.get('range')).toBe('bytes=0-0');
    expect(read).toMatchObject({
      status: 206,
      contentType: 'video/x-matroska',
      contentLength: '1',
    });
  });

  it('reads nothing where the linked server has nothing to send', async () => {
    const renditions = linkedRenditions(
      aLocal(),
      aLinkedAskerAnswering(() => new Response(null, { status: 404 })),
    );

    expect(await renditions.readDownloadFile(LINKED_ID, 'original', null)).toBeNull();
    expect(await renditions.readDownloadFile('linked~broken', 'original', null)).toBeNull();
  });
});
