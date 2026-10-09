import { releasePartsOf } from './releasePartsOf';
import type { SubtitleReason } from '@ValenceContracts/schemas/SubtitleFinding';
import type { ReleaseParts } from './ReleaseParts';

const SAME_FRAME_RATE = 0.01;

type SubtitleScore = {
  score: number;
  reasons: SubtitleReason[];
  isDrifting: boolean;
};

const PARTS: readonly [keyof ReleaseParts, SubtitleReason, number][] = [
  ['group', 'sameGroup', 30],
  ['source', 'sameSource', 20],
  ['resolution', 'sameResolution', 10],
  ['videoCodec', 'sameVideoCodec', 10],
  ['service', 'sameService', 10],
  ['audioCodec', 'sameAudioCodec', 5],
  ['edition', 'sameEdition', 5],
];

/**
 * How well a subtitle fits a file, out of a hundred, and why. One OpenSubtitles made for this very
 * file scores full marks outright. Otherwise each part of the subtitle's release that the file's
 * name shares adds to it — the group most, then the source — and the same frame rate adds the
 * rest. One made for a different frame rate scores nothing, whatever else it shares, because it
 * drifts out of step: a 25 fps subtitle on a 23.976 fps film is about four seconds out within a
 * minute and a half.
 *
 * @param file - The file's release parts and frame rate.
 * @param subtitle - The subtitle's release name and frame rate, and whether it was made for this
 *   very file.
 * @returns The score, the reasons for it, and whether it would drift.
 */
const scoreSubtitle = (
  file: { parts: ReleaseParts; frameRate: number | null },
  subtitle: { release: string; frameRate: number | null; isExactMatch: boolean },
): SubtitleScore => {
  if (subtitle.isExactMatch) {
    return { score: 100, reasons: ['madeForThisFile'], isDrifting: false };
  }

  const parts = releasePartsOf(subtitle.release);
  const shared = PARTS.filter(
    ([part]) => file.parts[part] !== null && file.parts[part] === parts[part],
  );
  const isDrifting =
    file.frameRate !== null &&
    subtitle.frameRate !== null &&
    Math.abs(file.frameRate - subtitle.frameRate) >= SAME_FRAME_RATE;
  const isSameFrameRate = file.frameRate !== null && subtitle.frameRate !== null && !isDrifting;
  const isSameRelease =
    shared.some(([part]) => part === 'group') && shared.some(([part]) => part === 'source');
  const reasons: SubtitleReason[] = [
    ...(isDrifting ? (['differentFrameRate'] as const) : []),
    ...(isSameRelease ? (['sameRelease'] as const) : []),
    ...shared
      .map(([, reason]) => reason)
      .filter((reason) => !isSameRelease || (reason !== 'sameGroup' && reason !== 'sameSource')),
    ...(isSameFrameRate ? (['sameFrameRate'] as const) : []),
  ];

  return {
    score: isDrifting
      ? 0
      : Math.min(
          99,
          shared.reduce((sum, [, , weight]) => sum + weight, 0) + (isSameFrameRate ? 10 : 0),
        ),
    reasons,
    isDrifting,
  };
};

export type { SubtitleScore };

export { scoreSubtitle };
