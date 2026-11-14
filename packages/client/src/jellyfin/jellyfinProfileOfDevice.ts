/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own profile field values, which its server matches on and no person reads */
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const RANGE_TYPES: Readonly<Record<string, string>> = {
  SDR: 'SDR',
  HDR10: 'HDR10',
  HDR10Plus: 'HDR10Plus',
  HLG: 'HLG',
  DolbyVision: 'DOVI|DOVIWithHDR10|DOVIWithHLG|DOVIWithSDR',
};

const SUBTITLES: Readonly<Record<string, string>> = {
  srt: 'srt',
  webvtt: 'vtt',
  ass: 'ass',
  ssa: 'ssa',
  pgs: 'pgssub',
  vobsub: 'dvdsub',
  dvbsub: 'dvbsub',
};

/**
 * What a Valence app can play, said the way a Jellyfin app says it, so a Jellyfin server sends the
 * file as it is where the app can take it and converts it where it cannot, exactly as it would for
 * one of its own apps.
 *
 * @param profile - What the app can play, as Valence's apps say it.
 * @returns The same, as Jellyfin reads a device profile.
 */
const jellyfinProfileOfDevice = (profile: DeviceProfile) => ({
  Name: profile.name,
  ...(profile.maxBitrateKbps === null || profile.maxBitrateKbps === undefined
    ? {}
    : { MaxStreamingBitrate: profile.maxBitrateKbps * 1000 }),
  DirectPlayProfiles: profile.directPlayProfiles.map((one) => ({
    Container: one.container,
    Type: 'Video',
    VideoCodec: one.videoCodecs.join(','),
    AudioCodec: one.audioCodecs.join(','),
  })),
  TranscodingProfiles: profile.transcodingProfiles
    .filter((one) => one.protocol === 'hls')
    .map((one) => ({
      Container: one.container,
      Type: 'Video',
      VideoCodec: one.videoCodec,
      AudioCodec: one.audioCodec,
      Protocol: 'hls',
      Context: 'Streaming',
      MaxAudioChannels: profile.maxAudioChannels.toString(),
      MinSegments: 1,
      BreakOnNonKeyFrames: true,
    })),
  CodecProfiles: [
    {
      Type: 'Video',
      Conditions: [
        {
          Condition: 'LessThanEqual',
          Property: 'Width',
          Value: profile.maxWidth.toString(),
          IsRequired: false,
        },
        {
          Condition: 'LessThanEqual',
          Property: 'Height',
          Value: profile.maxHeight.toString(),
          IsRequired: false,
        },
        {
          Condition: 'EqualsAny',
          Property: 'VideoRangeType',
          Value: profile.supportedVideoRanges.map((range) => RANGE_TYPES[range] ?? range).join('|'),
          IsRequired: false,
        },
      ],
    },
    ...profile.directPlayProfiles
      .flatMap((one) => one.videoCodecs)
      .filter(
        (codec, at, all) => all.indexOf(codec) === at && !profile.tenBitVideoCodecs.includes(codec),
      )
      .map((codec) => ({
        Type: 'Video',
        Codec: codec,
        Conditions: [
          { Condition: 'LessThanEqual', Property: 'VideoBitDepth', Value: '8', IsRequired: false },
        ],
      })),
    {
      Type: 'VideoAudio',
      Conditions: [
        {
          Condition: 'LessThanEqual',
          Property: 'AudioChannels',
          Value: profile.maxAudioChannels.toString(),
          IsRequired: false,
        },
      ],
    },
  ],
  SubtitleProfiles: profile.supportedSubtitleFormats
    .map((format) => SUBTITLES[format])
    .filter((format) => format !== undefined)
    .map((format) => ({ Format: format, Method: 'Encode' })),
});

export { jellyfinProfileOfDevice };
