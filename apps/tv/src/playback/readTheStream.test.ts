import type { VideoTrack } from 'expo-video';
import { readTheStream } from '@ValenceTv/playback/readTheStream';

const A_TRACK: VideoTrack = {
  id: 'v1',
  url: null,
  size: { width: 1920, height: 1080 },
  mimeType: 'video/hevc',
  isSupported: true,
  bitrate: 8_000_000,
  averageBitrate: 6_000_000,
  peakBitrate: 8_000_000,
  frameRate: 23.976,
  videoRange: 'pq',
};

describe('readTheStream', () => {
  it('reads where the player is, how far it has buffered and the picture it is sent', () => {
    expect(readTheStream({ currentTime: 12, bufferedPosition: 40, videoTrack: A_TRACK })).toEqual({
      positionSeconds: 12,
      bufferedSeconds: 40,
      width: 1920,
      height: 1080,
      mimeType: 'video/hevc',
      bitrate: 8_000_000,
      frameRate: 23.976,
      range: 'pq',
    });
  });

  it('falls back on the average bitrate where the player gives no other', () => {
    expect(
      readTheStream({
        currentTime: 0,
        bufferedPosition: 0,
        videoTrack: { ...A_TRACK, bitrate: null },
      }).bitrate,
    ).toBe(6_000_000);
  });

  it('leaves the picture empty before the player has one', () => {
    expect(readTheStream({ currentTime: 3, bufferedPosition: 5, videoTrack: null })).toEqual({
      positionSeconds: 3,
      bufferedSeconds: 5,
      width: null,
      height: null,
      mimeType: null,
      bitrate: null,
      frameRate: null,
      range: null,
    });
  });
});
