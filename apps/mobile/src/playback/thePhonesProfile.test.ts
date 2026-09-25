import { Platform } from 'react-native';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { thePhonesProfile } from './thePhonesProfile';

describe('thePhonesProfile', () => {
  it('is a profile the server will accept', () => {
    expect(() => DeviceProfileSchema.parse(thePhonesProfile())).not.toThrow();
  });

  it('names the phone, so a session list says which device it is', () => {
    expect(thePhonesProfile().name).toBe("Dan's iPhone");
  });

  it('plays what every phone that runs iOS 18 decodes in hardware', () => {
    const played = thePhonesProfile().directPlayProfiles[0];

    expect(played?.videoCodecs).toEqual(['h264', 'hevc']);
    expect(played?.audioCodecs).toContain('aac');
  });

  it('claims no av1, since only the newest phones have it and this cannot tell which it is', () => {
    expect(thePhonesProfile().directPlayProfiles[0]?.videoCodecs).not.toContain('av1');
  });

  it('asks for every channel it can decode, so headphones have something to place', () => {
    expect(thePhonesProfile().maxAudioChannels).toBe(8);
  });

  it('does not ask the server to fold the sound down, which iOS does better and later', () => {
    expect(thePhonesProfile().maxAudioChannels).toBeGreaterThan(2);
  });

  it('takes ten-bit hevc, which is most of what a library holds in hdr', () => {
    expect(thePhonesProfile().tenBitVideoCodecs).toContain('hevc');
  });

  it('refuses interlaced, which nothing here can deinterlace', () => {
    expect(thePhonesProfile().canPlayInterlaced).toBe(false);
  });

  it('asks for h264 over hls where it cannot be sent the file as it is', () => {
    expect(thePhonesProfile().transcodingProfiles[0]).toMatchObject({
      videoCodec: 'h264',
      protocol: 'hls',
    });
  });

  it('measures itself in real pixels rather than points', () => {
    expect(thePhonesProfile().maxWidth).toBeGreaterThan(1000);
  });

  describe('on Android', () => {
    const was = Platform.OS;

    beforeEach(() => {
      Platform.OS = 'android';
    });

    afterEach(() => {
      Platform.OS = was;
    });

    it('takes no ten-bit video and no HDR, which plenty of Android phones cannot decode', () => {
      expect(thePhonesProfile().tenBitVideoCodecs).toEqual([]);
      expect(thePhonesProfile().supportedVideoRanges).toEqual(['SDR']);
    });

    it('takes AAC alone as it is, since Dolby audio is not on every Android phone', () => {
      expect(thePhonesProfile().directPlayProfiles[0]?.audioCodecs).toEqual(['aac']);
    });

    it('asks for transport streams when transcoded, whose timing its player reads', () => {
      expect(thePhonesProfile().transcodingProfiles[0]?.container).toBe('ts');
    });

    it('is still a profile the server will accept', () => {
      expect(() => DeviceProfileSchema.parse(thePhonesProfile())).not.toThrow();
    });
  });
});
