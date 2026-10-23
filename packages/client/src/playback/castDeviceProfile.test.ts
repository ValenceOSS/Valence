import { describe, expect, it } from 'vitest';
import { castDeviceProfile } from '@ValenceClient/playback/castDeviceProfile';

describe('castDeviceProfile', () => {
  it('asks for what every Chromecast plays, whatever the browser sending it plays', () => {
    const profile = castDeviceProfile('Cast');

    expect(profile).toMatchObject({
      name: 'Cast',
      maxHeight: 1080,
      maxAudioChannels: 2,
      supportedVideoRanges: ['SDR'],
      tenBitVideoCodecs: [],
      directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
    });
  });
});
