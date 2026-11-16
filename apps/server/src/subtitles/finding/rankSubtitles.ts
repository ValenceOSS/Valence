import { namesHearingImpaired } from './namesHearingImpaired';
import { scoreSubtitle } from './scoreSubtitle';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleVideo } from './SubtitleVideo';

/**
 * Scores each subtitle found against the file it is for and puts them in order, as Bazarr lists a
 * manual search: one made for this very file first, then the best fit, then the most downloaded,
 * and one made for a different frame rate last whatever else it shares. One whose name gives
 * another season or episode is left out, as Bazarr leaves it out, and one whose name says it is
 * hearing-impaired is marked so where the site did not say.
 *
 * @param video - The file.
 * @param found - What the subtitle sites returned.
 * @returns The subtitles, scored and in order.
 */
const rankSubtitles = (video: SubtitleVideo, found: readonly FoundSubtitle[]): FoundSubtitle[] =>
  found
    .map((subtitle) => {
      const scored = scoreSubtitle(video, {
        release: subtitle.name,
        frameRate: subtitle.frameRate,
        isExactMatch: subtitle.isExactMatch,
      });

      return {
        ...subtitle,
        isHearingImpaired: subtitle.isHearingImpaired || namesHearingImpaired(subtitle.name),
        score: scored.score,
        reasons: scored.reasons,
        matches: scored.matches,
        misses: scored.misses,
        unknowns: scored.unknowns,
        isDrifting: scored.isDrifting,
        isAnotherEpisode: scored.isAnotherEpisode,
      };
    })
    .filter((subtitle) => !subtitle.isAnotherEpisode)
    .toSorted(
      (left, right) =>
        Number(left.isDrifting) - Number(right.isDrifting) ||
        Number(right.isExactMatch) - Number(left.isExactMatch) ||
        right.score - left.score ||
        (right.downloads ?? 0) - (left.downloads ?? 0),
    )
    .map(
      ({ isDrifting: _isDrifting, isAnotherEpisode: _isAnotherEpisode, ...subtitle }) => subtitle,
    );

export { rankSubtitles };
