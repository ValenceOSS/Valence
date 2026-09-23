import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';

describe('theTvsProfile', () => {
  it('describes an Apple TV that plays 4K HEVC and H.264 with Dolby sound', () => {
    const profile = theTvsProfile();

    expect(profile.name).toBe('Apple TV');
    expect(profile.maxWidth).toBe(3840);
    expect(profile.maxHeight).toBe(2160);
    expect(profile.maxAudioChannels).toBe(8);
    expect(profile.supportedVideoRanges).toContain('DolbyVision');
    expect(profile.directPlayProfiles.map((each) => each.container)).toEqual(['mp4', 'mov']);
  });

  it('describes an Android TV by what nearly every one plays, Matroska included', () => {
    const profile = theTvsProfile('android');

    expect(profile.name).toBe('Android TV');
    expect(profile.supportedVideoRanges).not.toContain('DolbyVision');
    expect(profile.directPlayProfiles.map((each) => each.container)).toEqual(['mp4', 'mkv']);
    expect(profile.transcodingProfiles).toEqual(theTvsProfile('ios').transcodingProfiles);
  });

  it('asks for HLS in H.264 and AAC for anything it cannot open whole', () => {
    expect(theTvsProfile().transcodingProfiles).toEqual([
      expect.objectContaining({
        container: 'mp4',
        videoCodec: 'h264',
        audioCodec: 'aac',
        protocol: 'hls',
      }),
    ]);
  });
});
