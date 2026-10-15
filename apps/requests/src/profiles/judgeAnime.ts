import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { AnimeAudioPolicy } from '@ValenceContracts/schemas/AnimeAudioPolicy';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';

const DUB_POINTS = 100;

const GROUP_POINTS = 200;

/**
 * How an anime release stands with the speech a show is wanted in and the release group it is
 * kept to: one with subtitles is refused where a dub is wanted, a dub where subtitles are, and
 * anything but dual audio where that is; where subtitles do until a dub comes, a dub or dual audio
 * scores above them, so it is taken as an upgrade when it comes; and the show's own release group
 * scores above any other.
 *
 * A release that does not say what its speech is counts as subtitled, as fansub releases almost
 * always are.
 *
 * @param parsed - What the release's name says.
 * @param policy - The speech the show is wanted in.
 * @param preferredGroup - The release group the show is kept to, where it is.
 * @returns What it scores, why, and why it is refused.
 */
const judgeAnime = (
  parsed: Pick<ParsedRelease, 'spokenAudio' | 'group'>,
  policy: AnimeAudioPolicy,
  preferredGroup: string | null,
): { score: number; rejections: Said[]; reasons: Said[] } => {
  const spoken = parsed.spokenAudio ?? 'subbed';
  const isDubbed = spoken === 'dubbed' || spoken === 'dual';
  const isOurs =
    preferredGroup !== null &&
    parsed.group !== null &&
    parsed.group.toLowerCase() === preferredGroup.toLowerCase();
  const rejections = [
    ...(policy === 'subbed' && spoken === 'dubbed'
      ? [saying('requests.profiles.judgeAnime.itIsDubbedAndSubtitles')]
      : []),
    ...(policy === 'dubbed' && !isDubbed
      ? [saying('requests.profiles.judgeAnime.itIsNotDubbed')]
      : []),
    ...(policy === 'dual' && spoken !== 'dual'
      ? [saying('requests.profiles.judgeAnime.itIsNotDualAudio')]
      : []),
  ];
  const dubbed = policy === 'subbedUntilDubbed' && isDubbed;

  return {
    score: (dubbed ? DUB_POINTS : 0) + (isOurs ? GROUP_POINTS : 0),
    rejections,
    reasons: [
      ...(dubbed ? [saying('requests.profiles.judgeAnime.itHasADub', { points: DUB_POINTS })] : []),
      ...(isOurs
        ? [
            saying('requests.profiles.judgeAnime.fromTheShowsGroup', {
              group: preferredGroup,
              points: GROUP_POINTS,
            }),
          ]
        : []),
    ],
  };
};

export { judgeAnime };
