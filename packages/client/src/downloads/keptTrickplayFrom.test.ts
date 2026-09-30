import { describe, expect, it } from 'vitest';
import { keptTrickplayFrom } from './keptTrickplayFrom';

const VTT = [
  'WEBVTT',
  '',
  '00:00:00.000 --> 00:00:10.000',
  'sheet-001.jpg#xywh=0,0,320,180',
  '',
  '00:00:10.000 --> 00:00:20.000',
  'sheet-001.jpg#xywh=320,0,320,180',
].join('\n');

describe('keptTrickplayFrom', () => {
  it('finds each sheet beside the index kept on the desktop', () => {
    const kept = keptTrickplayFrom(VTT, '/held/abc/trickplay/thumbnails.vtt');

    expect(kept?.thumbnails[1]).toMatchObject({
      startSeconds: 10,
      sheetUrl: '/held/abc/trickplay/sheet-001.jpg',
      x: 320,
    });
  });

  it('finds each sheet beside the index kept on a phone', () => {
    const kept = keptTrickplayFrom(VTT, 'file:///held/abc.trickplay/thumbnails.vtt');

    expect(kept?.thumbnails[0]?.sheetUrl).toBe('file:///held/abc.trickplay/sheet-001.jpg');
  });

  it('takes the size of a thumbnail from the thumbnails themselves', () => {
    expect(keptTrickplayFrom(VTT, '/held/abc/trickplay/thumbnails.vtt')).toMatchObject({
      width: 320,
      height: 180,
    });
  });

  it('answers with nothing for an index that holds none', () => {
    expect(keptTrickplayFrom('WEBVTT\n', '/held/abc/trickplay/thumbnails.vtt')).toBeNull();
  });
});
