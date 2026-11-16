import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { SUBTITLE_SCORES } from './SUBTITLE_SCORES';
import { releasePartsOf } from './releasePartsOf';
import { SUBTITLE_CRITERIA } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleCriterion, SubtitleReason } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleVideo } from './SubtitleVideo';

const SAME_FRAME_RATE = 0.01;

const FILM_FRAME_RATES = [23.976, 23.98, 24];

const SOURCE_FAMILIES: Readonly<Record<string, string>> = {
  remux: 'disk-hd',
  bluray: 'disk-hd',
  webdl: 'web',
  webrip: 'web',
  hdtv: 'tv',
  dvd: 'disk-sd',
};

const EQUIVALENT_GROUPS: readonly (readonly string[])[] = [
  ['framestor', 'w4nk3r', 'bhdstudio'],
  ['lol', 'dimension'],
  ['asap', 'immerse', 'fleet'],
  ['avs', 'sva'],
];

type SubtitleScore = {
  score: number;
  reasons: SubtitleReason[];
  matches: SubtitleCriterion[];
  misses: SubtitleCriterion[];
  unknowns: SubtitleCriterion[];
  isDrifting: boolean;
  isAnotherEpisode: boolean;
};

/**
 * Whether two release groups are the same, or ones Bazarr counts as the same.
 *
 * @param mine - The file's group.
 * @param theirs - The subtitle's group.
 * @returns Whether they match.
 */
const isSameGroup = (mine: string, theirs: string): boolean => {
  const plain = (group: string) => group.toLowerCase().replaceAll(/[^a-z0-9]/g, '');

  return (
    plain(mine) === plain(theirs) ||
    EQUIVALENT_GROUPS.some((same) => same.includes(plain(mine)) && same.includes(plain(theirs)))
  );
};

/**
 * Whether two frame rates are the same, counting 23.976, 23.98 and 24 as one as Bazarr does.
 *
 * @param mine - The file's.
 * @param theirs - The subtitle's.
 * @returns Whether they are the same.
 */
const isSameFrameRate = (mine: number, theirs: number): boolean =>
  Math.abs(mine - theirs) < SAME_FRAME_RATE ||
  (FILM_FRAME_RATES.some((one) => Math.abs(one - mine) < SAME_FRAME_RATE) &&
    FILM_FRAME_RATES.some((one) => Math.abs(one - theirs) < SAME_FRAME_RATE));

/**
 * How well a subtitle fits a file, out of a hundred, scored the way Bazarr scores a manual search.
 *
 * Bazarr weighs what a subtitle shares with the file: for a film its title, year, source, edition
 * and release group most, its codecs, resolution and streaming service a point each; for an episode
 * its programme, year, season and number most. Valence asks the sites by the title's catalogue ids,
 * so the title, year, programme, season and number always match, except where a subtitle's own name
 * gives another season or episode, which Bazarr would not list at all. A release group counts only
 * where the source matches too, and an edition or streaming service counts where both name the same
 * one or neither names any. Hearing-impaired always scores, as it does in Bazarr's manual search.
 * The total is a share of the most it could have been. Each thing it was checked on is said to
 * match, to miss, or to be unknown where the file or the subtitle does not name it, which for an
 * edition or a streaming service means neither names one, though Bazarr scores that as a match.
 *
 * One OpenSubtitles made for this very file scores full marks outright; anything else scores at
 * most 99. One made for a different frame rate scores nothing, whatever else it shares, because it
 * drifts out of step: a 25 fps subtitle on a 23.976 fps film is about four seconds out within a
 * minute and a half.
 *
 * @param video - The file.
 * @param subtitle - The subtitle's release name and frame rate, and whether it was made for this
 *   very file.
 * @returns The score; what matched, what did not and what could not be told; the reasons older
 *   apps list; whether it drifts; and whether it names another episode.
 */
const scoreSubtitle = (
  video: SubtitleVideo,
  subtitle: { release: string; frameRate: number | null; isExactMatch: boolean },
): SubtitleScore => {
  const hasFrameRates = video.frameRate !== null && subtitle.frameRate !== null;
  const isDrifting =
    video.frameRate !== null &&
    subtitle.frameRate !== null &&
    !isSameFrameRate(video.frameRate, subtitle.frameRate);

  if (subtitle.isExactMatch) {
    return {
      score: 100,
      reasons: ['madeForThisFile'],
      matches: [...SUBTITLE_CRITERIA],
      misses: [],
      unknowns: [],
      isDrifting: false,
      isAnotherEpisode: false,
    };
  }

  const mine = video.parts;
  const theirs = releasePartsOf(subtitle.release);
  const named = parseReleaseName(subtitle.release);
  const isAnotherEpisode =
    video.kind === 'episode' &&
    ((video.season !== null && named.seasons.length > 0 && !named.seasons.includes(video.season)) ||
      (video.episode !== null &&
        named.episodes.length > 0 &&
        Math.min(...named.episodes) !== video.episode));
  const sameWhereBoth = (left: string | null, right: string | null) =>
    left !== null && right !== null && left === right;
  const sameOrNeither = (left: string | null, right: string | null) =>
    left === null ? right === null : left === right;
  const sameSource =
    mine.source !== null &&
    theirs.source !== null &&
    (SOURCE_FAMILIES[mine.source] ?? mine.source) ===
      (SOURCE_FAMILIES[theirs.source] ?? theirs.source);
  const matched = new Set<SubtitleCriterion>([
    ...(sameSource ? (['source'] as const) : []),
    ...(sameSource &&
    mine.group !== null &&
    theirs.group !== null &&
    isSameGroup(mine.group, theirs.group)
      ? (['releaseGroup'] as const)
      : []),
    ...(sameWhereBoth(mine.resolution, theirs.resolution) ? (['resolution'] as const) : []),
    ...(sameWhereBoth(mine.videoCodec, theirs.videoCodec) ? (['videoCodec'] as const) : []),
    ...(sameWhereBoth(mine.audioCodec, theirs.audioCodec) ? (['audioCodec'] as const) : []),
    ...(sameOrNeither(mine.edition, theirs.edition) ? (['edition'] as const) : []),
    ...(sameOrNeither(mine.service, theirs.service) ? (['streamingService'] as const) : []),
    ...(hasFrameRates && !isDrifting ? (['frameRate'] as const) : []),
  ]);
  const eitherUnnamed = (left: string | null, right: string | null) =>
    left === null || right === null;
  const undetermined = new Set<SubtitleCriterion>([
    ...(eitherUnnamed(mine.source, theirs.source) ? (['source'] as const) : []),
    ...(eitherUnnamed(mine.group, theirs.group) ? (['releaseGroup'] as const) : []),
    ...(eitherUnnamed(mine.resolution, theirs.resolution) ? (['resolution'] as const) : []),
    ...(eitherUnnamed(mine.videoCodec, theirs.videoCodec) ? (['videoCodec'] as const) : []),
    ...(eitherUnnamed(mine.audioCodec, theirs.audioCodec) ? (['audioCodec'] as const) : []),
    ...(mine.edition === null && theirs.edition === null ? (['edition'] as const) : []),
    ...(mine.service === null && theirs.service === null ? (['streamingService'] as const) : []),
    ...(hasFrameRates ? [] : (['frameRate'] as const)),
  ]);
  const weights: Readonly<Record<string, number>> = SUBTITLE_SCORES[video.kind];
  const most = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const given = [
    ...(video.kind === 'episode' ? ['series', 'year', 'season', 'episode'] : ['title', 'year']),
    'hearingImpaired',
    ...matched,
  ].reduce((sum, criterion) => sum + (weights[criterion] ?? 0), 0);
  const isSameRelease = matched.has('releaseGroup');
  const reasons: SubtitleReason[] = [
    ...(isDrifting ? (['differentFrameRate'] as const) : []),
    ...(isSameRelease ? (['sameRelease'] as const) : []),
    ...(matched.has('source') && !isSameRelease ? (['sameSource'] as const) : []),
    ...(matched.has('resolution') ? (['sameResolution'] as const) : []),
    ...(matched.has('videoCodec') ? (['sameVideoCodec'] as const) : []),
    ...(sameWhereBoth(mine.service, theirs.service) ? (['sameService'] as const) : []),
    ...(matched.has('audioCodec') ? (['sameAudioCodec'] as const) : []),
    ...(sameWhereBoth(mine.edition, theirs.edition) ? (['sameEdition'] as const) : []),
    ...(matched.has('frameRate') ? (['sameFrameRate'] as const) : []),
  ];

  return {
    score: isDrifting || isAnotherEpisode ? 0 : Math.min(99, Math.round((given / most) * 100)),
    reasons,
    matches: SUBTITLE_CRITERIA.filter(
      (criterion) => matched.has(criterion) && !undetermined.has(criterion),
    ),
    misses: SUBTITLE_CRITERIA.filter(
      (criterion) => !matched.has(criterion) && !undetermined.has(criterion),
    ),
    unknowns: SUBTITLE_CRITERIA.filter((criterion) => undetermined.has(criterion)),
    isDrifting,
    isAnotherEpisode,
  };
};

export type { SubtitleScore };

export { scoreSubtitle };
