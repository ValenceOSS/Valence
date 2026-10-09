import { basename, dirname, extname } from 'node:path';
import { releasePartsOf } from './releasePartsOf';
import { scoreSubtitle } from './scoreSubtitle';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * Scores each subtitle found against the file it is for and puts them in order: one made for this
 * very file first, then the best fit, then the most downloaded, and one made for a different frame
 * rate last whatever else it shares. The file is read by its own name, then its folder's, since a
 * film's folder often carries the release its file name leaves out.
 *
 * @param file - The file's path and its probed frame rate.
 * @param found - What the subtitle sites returned.
 * @returns The subtitles, scored and in order.
 */
const rankSubtitles = (
  file: { path: string; frameRate: number | null },
  found: readonly FoundSubtitle[],
): FoundSubtitle[] => {
  const parts = releasePartsOf(
    basename(file.path, extname(file.path)),
    basename(dirname(file.path)),
  );

  return found
    .map((subtitle) => {
      const scored = scoreSubtitle(
        { parts, frameRate: file.frameRate },
        {
          release: subtitle.name,
          frameRate: subtitle.frameRate,
          isExactMatch: subtitle.isExactMatch,
        },
      );

      return {
        ...subtitle,
        score: scored.score,
        reasons: scored.reasons,
        isDrifting: scored.isDrifting,
      };
    })
    .toSorted(
      (left, right) =>
        Number(left.isDrifting) - Number(right.isDrifting) ||
        Number(right.isExactMatch) - Number(left.isExactMatch) ||
        right.score - left.score ||
        (right.downloads ?? 0) - (left.downloads ?? 0),
    )
    .map(({ isDrifting: _isDrifting, ...subtitle }) => subtitle);
};

export { rankSubtitles };
