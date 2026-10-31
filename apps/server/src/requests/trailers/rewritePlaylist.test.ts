import { describe, expect, it } from 'vitest';
import { rewritePlaylist } from './rewritePlaylist';

const MASTER = `#EXTM3U
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA:URI="https://manifest.googlevideo.com/audio",TYPE=AUDIO,GROUP-ID="234",NAME="Default",DEFAULT=YES
#EXT-X-MEDIA:URI="https://manifest.googlevideo.com/vtt",TYPE=SUBTITLES,GROUP-ID="vtt",NAME="English"
#EXT-X-STREAM-INF:BANDWIDTH=997206,CODECS="avc1.4D401F,mp4a.40.2",RESOLUTION=1280x720,AUDIO="234",SUBTITLES="vtt"
https://manifest.googlevideo.com/720
#EXT-X-STREAM-INF:BANDWIDTH=669914,CODECS="vp09.00.30.08,mp4a.40.2",RESOLUTION=854x480,AUDIO="234",SUBTITLES="vtt"
https://manifest.googlevideo.com/vp9
`;

const MEDIA = `#EXTM3U
#EXT-X-TARGETDURATION:8
#EXTINF:4.1,
https://rr1.googlevideo.com/one
#EXTINF:7.0,
https://rr1.googlevideo.com/two
#EXT-X-ENDLIST
`;

/**
 * Where a test's server serves an address: the address, marked as a playlist or a piece.
 *
 * @param url - The address.
 * @param isPlaylist - Whether it is a playlist.
 * @returns Its stand-in.
 */
const through = (url: string, isPlaylist: boolean) =>
  `/served/${isPlaylist ? 'list' : 'piece'}/${new URL(url).pathname.slice(1)}`;

describe('rewritePlaylist', () => {
  it('keeps the H.264 pictures and the sound, through the server, without subtitles', () => {
    const rewritten = rewritePlaylist(MASTER, 'https://manifest.googlevideo.com/master', through);

    expect(rewritten).toContain('URI="/served/list/audio"');
    expect(rewritten).toContain('/served/list/720');
    expect(rewritten).not.toContain('vp09');
    expect(rewritten).not.toContain('vp9');
    expect(rewritten).not.toContain('SUBTITLES');
    expect(rewritten).not.toContain('googlevideo.com');
  });

  it('puts each piece of a playlist through the server', () => {
    const rewritten = rewritePlaylist(MEDIA, 'https://manifest.googlevideo.com/720', through);

    expect(rewritten.split('\n')).toEqual([
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:8',
      '#EXTINF:4.1,',
      '/served/piece/one',
      '#EXTINF:7.0,',
      '/served/piece/two',
      '#EXT-X-ENDLIST',
      '',
    ]);
  });

  it('reads an address written relative to where the playlist was', () => {
    const rewritten = rewritePlaylist(
      '#EXTM3U\n#EXTINF:4,\nsegment/1.ts\n',
      'https://rr1.googlevideo.com/list/index.m3u8',
      through,
    );

    expect(rewritten).toContain('/served/piece/list/segment/1.ts');
  });
});
