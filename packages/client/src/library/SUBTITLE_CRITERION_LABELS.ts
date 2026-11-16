import { say } from '@ValenceI18n/say';
import type { SubtitleCriterion } from '@ValenceContracts/schemas/SubtitleFinding';

const SUBTITLE_CRITERION_LABELS = {
  source: say('common.source'),
  edition: say('screens.findSubtitlesDialog.edition'),
  releaseGroup: say('screens.profileEditor.customFormats.releaseGroup'),
  resolution: say('common.resolution'),
  videoCodec: say('screens.profileEditor.customFormats.videoCodec'),
  audioCodec: say('screens.findSubtitlesDialog.audioCodec'),
  streamingService: say('screens.findSubtitlesDialog.streamingService'),
  frameRate: say('tv.player.streamStats.frameRate'),
} as const satisfies Record<SubtitleCriterion, string>;

export { SUBTITLE_CRITERION_LABELS };
