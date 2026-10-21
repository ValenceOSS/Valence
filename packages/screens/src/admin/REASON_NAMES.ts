import type { Reason } from '@ValenceContracts/schemas/PlaybackPlan';
import { say } from '@ValenceI18n/say';

const REASON_NAMES: Readonly<Record<Reason['code'], string>> = {
  ClientSupportsSource: say('screens.admin.reasonNames.clientSupportsSource'),
  ContainerNotSupported: say('screens.admin.reasonNames.containerNotSupported'),
  VideoCodecNotSupported: say('screens.admin.reasonNames.videoCodecNotSupported'),
  VideoProfileNotSupported: say('screens.admin.reasonNames.videoProfileNotSupported'),
  VideoBitrateAboveLimit: say('screens.admin.reasonNames.videoBitrateAboveLimit'),
  VideoResolutionAboveLimit: say('screens.admin.reasonNames.videoResolutionAboveLimit'),
  VideoRangeNotSupported: say('screens.admin.reasonNames.videoRangeNotSupported'),
  VideoNotSegmentable: say('screens.admin.reasonNames.videoNotSegmentable'),
  VideoLevelNotSupported: say('screens.admin.reasonNames.videoLevelNotSupported'),
  VideoFramerateNotSupported: say('screens.admin.reasonNames.videoFramerateNotSupported'),
  InterlacedVideoNotSupported: say('screens.admin.reasonNames.interlacedVideoNotSupported'),
  RefFramesNotSupported: say('screens.admin.reasonNames.refFramesNotSupported'),
  AnamorphicVideoNotSupported: say('screens.admin.reasonNames.anamorphicVideoNotSupported'),
  VideoRotationNotSupported: say('screens.admin.reasonNames.videoRotationNotSupported'),
  AudioSampleRateNotSupported: say('screens.admin.reasonNames.audioSampleRateNotSupported'),
  AudioProfileNotSupported: say('screens.admin.reasonNames.audioProfileNotSupported'),
  AudioCodecNotSupported: say('screens.admin.reasonNames.audioCodecNotSupported'),
  AudioChannelsAboveLimit: say('screens.admin.reasonNames.audioChannelsAboveLimit'),
  AudioBitrateAboveLimit: say('screens.admin.reasonNames.audioBitrateAboveLimit'),
  SubtitleFormatNotSupported: say('screens.admin.reasonNames.subtitleFormatNotSupported'),
  SubtitleNotCarryableInContainer: say('screens.admin.reasonNames.subtitleNotCarryableInContainer'),
  UserForcedTranscode: say('screens.admin.reasonNames.userForcedTranscode'),
  ClientCouldNotPlayTheCopy: say('screens.admin.reasonNames.clientCouldNotPlayTheCopy'),
};

export { REASON_NAMES };
