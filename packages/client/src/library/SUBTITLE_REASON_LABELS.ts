import { say } from '@ValenceI18n/say';
import type { SubtitleReason } from '@ValenceContracts/schemas/SubtitleFinding';

const SUBTITLE_REASON_LABELS = {
  madeForThisFile: say('screens.findSubtitlesDialog.madeForThisFile'),
  sameRelease: say('screens.findSubtitlesDialog.sameRelease'),
  sameGroup: say('screens.findSubtitlesDialog.sameGroup'),
  sameSource: say('screens.findSubtitlesDialog.sameSource'),
  sameResolution: say('screens.findSubtitlesDialog.sameResolution'),
  sameVideoCodec: say('screens.findSubtitlesDialog.sameVideoCodec'),
  sameAudioCodec: say('screens.findSubtitlesDialog.sameAudioCodec'),
  sameService: say('screens.findSubtitlesDialog.sameService'),
  sameEdition: say('screens.findSubtitlesDialog.sameEdition'),
  sameFrameRate: say('screens.findSubtitlesDialog.sameFrameRate'),
  differentFrameRate: say('screens.findSubtitlesDialog.differentFrameRateWillDrift'),
} as const satisfies Record<SubtitleReason, string>;

export { SUBTITLE_REASON_LABELS };
