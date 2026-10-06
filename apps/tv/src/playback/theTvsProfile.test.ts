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

  it('holds an Android TV that cannot say what it plays to what every one decodes', () => {
    const profile = theTvsProfile('android', null);

    expect(profile.name).toBe('Android TV');
    expect(profile.supportedVideoRanges).toEqual(['SDR']);
    expect(profile.tenBitVideoCodecs).toEqual([]);
    expect(profile.directPlayProfiles.map((each) => each.container)).toEqual(['mp4', 'mkv']);
    expect(profile.directPlayProfiles[0]?.audioCodecs).not.toContain('ac3');
    expect(profile.transcodingProfiles).toEqual([
      expect.objectContaining({ container: 'ts', videoCodec: 'h264', protocol: 'hls' }),
    ]);
  });

  it('claims for an Android TV what its own decoders, screen and HDMI output say', () => {
    const profile = theTvsProfile('android', {
      video: [
        { codec: 'h264', maxLevel: 52, isTenBit: false, maxWidth: 3840, maxHeight: 2160 },
        { codec: 'hevc', maxLevel: 153, isTenBit: true, maxWidth: 3840, maxHeight: 2160 },
        { codec: 'dolbyvision', maxLevel: null, isTenBit: false, maxWidth: null, maxHeight: null },
      ],
      audio: ['aac', 'opus'],
      passthrough: ['eac3', 'truehd'],
      hdr: ['HDR10', 'DolbyVision'],
      screen: { width: 3840, height: 2160 },
    });

    expect(profile.maxWidth).toBe(3840);
    expect(profile.supportedVideoRanges).toEqual(['SDR', 'HDR10', 'DolbyVision']);
    expect(profile.tenBitVideoCodecs).toEqual(['hevc']);
    expect(profile.maxVideoLevels).toEqual({ h264: 52, hevc: 153 });
    expect(profile.directPlayProfiles[0]).toEqual({
      container: 'mp4',
      videoCodecs: ['h264', 'hevc'],
      audioCodecs: ['aac', 'eac3', 'truehd', 'opus'],
    });
  });

  it('claims no HDR on an Android TV whose decoders take only eight bits', () => {
    const profile = theTvsProfile('android', {
      video: [{ codec: 'hevc', maxLevel: 120, isTenBit: false, maxWidth: null, maxHeight: null }],
      audio: ['aac'],
      passthrough: [],
      hdr: ['HDR10', 'HLG'],
      screen: { width: 1280, height: 720 },
    });

    expect(profile.supportedVideoRanges).toEqual(['SDR']);
    expect(profile.maxWidth).toBe(1920);
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
