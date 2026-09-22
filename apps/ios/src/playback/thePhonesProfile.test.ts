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

  it('asks for two channels, which is what a phone has to put them through', () => {
    expect(thePhonesProfile().maxAudioChannels).toBe(2);
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
});
