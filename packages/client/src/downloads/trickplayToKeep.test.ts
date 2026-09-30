import { describe, expect, it, vi } from 'vitest';
import { trickplayToKeep } from './trickplayToKeep';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const INDEX_URL = '/api/playback/trickplay/t1/thumbnails.vtt';

const VTT = [
  'WEBVTT',
  '',
  '00:00:00.000 --> 00:00:10.000',
  'sheet-001.jpg#xywh=0,0,320,180',
  '',
  '00:00:10.000 --> 00:00:20.000',
  'sheet-001.jpg#xywh=320,0,320,180',
  '',
  '00:16:40.000 --> 00:16:50.000',
  'sheet-002.jpg#xywh=0,0,320,180',
].join('\n');

/**
 * A server that answers the thumbnail index and its WebVTT as given.
 *
 * @param index - What asking for the index answers.
 * @param vtt - The WebVTT served at the index's address.
 * @returns How to ask it.
 */
const aServer = (index: Response, vtt = VTT) =>
  vi.fn((path: string) => Promise.resolve(path === INDEX_URL ? new Response(vtt) : index.clone()));

const answering = () =>
  new Response(
    JSON.stringify({
      id: 't1',
      url: INDEX_URL,
      intervalSeconds: 10,
      tileWidth: 320,
      tileHeight: 180,
    }),
  );

describe('trickplayToKeep', () => {
  it('says which sheets there are, once each, and where the server has them', async () => {
    const kept = await trickplayToKeep(aServer(answering()), MEDIA_ID);

    expect(kept?.sheets).toEqual([
      { name: 'sheet-001.jpg', from: '/api/playback/trickplay/t1/sheet-001.jpg' },
      { name: 'sheet-002.jpg', from: '/api/playback/trickplay/t1/sheet-002.jpg' },
    ]);
    expect(kept?.vtt).toBe(VTT);
  });

  it('asks for them the way that has the server make them', async () => {
    const ask = aServer(answering());

    await trickplayToKeep(ask, MEDIA_ID);

    expect(ask).toHaveBeenCalledWith(`/api/playback/${MEDIA_ID}/trickplay`, { method: 'POST' });
  });

  it('answers with nothing while the server has not made them yet', async () => {
    const kept = await trickplayToKeep(aServer(new Response(null, { status: 404 })), MEDIA_ID);

    expect(kept).toBeNull();
  });

  it('keeps nothing from an index naming a sheet outside its own folder', async () => {
    const reaching = VTT.replace('sheet-002.jpg', '../../elsewhere.jpg');

    expect(await trickplayToKeep(aServer(answering(), reaching), MEDIA_ID)).toBeNull();
  });

  it('answers with nothing rather than throwing when the server cannot be reached', async () => {
    const ask = vi.fn(() => Promise.reject(new Error('unreachable')));

    expect(await trickplayToKeep(ask, MEDIA_ID)).toBeNull();
  });
});
