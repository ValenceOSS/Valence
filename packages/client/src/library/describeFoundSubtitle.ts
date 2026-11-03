import { SUBTITLE_REASON_LABELS } from '@ValenceClient/library/SUBTITLE_REASON_LABELS';
import { SUBTITLE_SITE_NAMES } from '@ValenceClient/library/SUBTITLE_SITE_NAMES';
import { say } from '@ValenceI18n/say';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * One line saying how well a subtitle found on a subtitle site fits the file and what else is worth
 * knowing before taking it, for a player that lists them as rows rather than in a table: how well it
 * matches, why, whether it describes sounds or was machine translated, and which site has it.
 *
 * @param subtitle - The subtitle found.
 * @returns The line.
 */
const describeFoundSubtitle = (subtitle: FoundSubtitle): string =>
  [
    say('client.library.describeFoundSubtitle.scoreMatch', { score: subtitle.score.toString() }),
    ...subtitle.reasons.map((reason) => SUBTITLE_REASON_LABELS[reason]),
    ...(subtitle.isHearingImpaired ? [say('screens.findSubtitlesDialog.sdh')] : []),
    ...(subtitle.isMachineTranslated ? [say('screens.findSubtitlesDialog.machineTranslated')] : []),
    SUBTITLE_SITE_NAMES[subtitle.source],
  ].join(' · ');

export { describeFoundSubtitle };
