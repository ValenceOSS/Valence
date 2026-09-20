import { hasWord } from '@ValenceRequests/profiles/hasWord';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type {
  MusicQuality,
  ParsedRelease,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import type { Judgement, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type Verdict = { score: number; rejections: string[]; reasons: string[] };

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

const MEGABYTE = 1024 * 1024;

const PREFERRED_WORD = 10;

const REVISION = 5;

/**
 * Judges one part of a release's quality against the profile's choices, best first: the further
 * up the list, the more it scores, and anything off the list is refused.
 *
 * @param value - What the release is, or null where its name does not say.
 * @param choices - What the profile takes, best first.
 * @param weight - What the best choice is worth, per place down the list.
 * @param unsaid - What to say where the name does not say, or null to let it through.
 * @returns The verdict.
 */
const judgeChoice = <Quality extends Resolution | ReleaseSource | MusicQuality>(
  value: Quality | null,
  choices: readonly Quality[],
  weight: number,
  unsaid: string | null,
): Verdict => {
  if (value === null) {
    return unsaid === null
      ? { score: 0, rejections: [], reasons: [] }
      : { score: 0, rejections: [unsaid], reasons: [] };
  }

  const place = choices.indexOf(value);
  const label = QUALITY_LABELS[value];
  const opening = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;

  if (place === -1) {
    return { score: 0, rejections: [`${opening} is not one this profile takes`], reasons: [] };
  }

  return {
    score: (choices.length - place) * weight,
    rejections: [],
    reasons: [`${opening}, the ${ORDINALS[place] ?? `number ${(place + 1).toString()}`} choice`],
  };
};

/**
 * Judges a release's size against the profile's limits: per album for music, and per hour for
 * video — the limits for its own source and resolution, where the profile sets them, and otherwise
 * the profile's own — which needs its running time — a whole season's cannot be judged without knowing how many
 * episodes it holds.
 *
 * @param release - The release.
 * @param parsed - What its name says.
 * @param profile - The profile.
 * @param runtimeMinutes - How long one film or episode runs, where known.
 * @returns The verdict.
 */
const judgeSize = (
  release: Release,
  parsed: ParsedRelease,
  profile: QualityProfile,
  runtimeMinutes: number | undefined,
): Verdict => {
  const nothing: Verdict = { score: 0, rejections: [], reasons: [] };
  const isVideo = profile.kind === 'video';
  const ownSize = isVideo
    ? profile.sizes.find(
        (size) => size.source === parsed.source && size.resolution === parsed.resolution,
      )
    : undefined;
  const smallest = ownSize?.minMb ?? profile.smallestMb;
  const largest = ownSize?.maxMb ?? profile.largestMb;

  if (release.sizeBytes === null || (smallest === null && largest === null)) {
    return nothing;
  }

  const megabytes = release.sizeBytes / MEGABYTE;

  if (isVideo && runtimeMinutes === undefined) {
    return { ...nothing, reasons: ['Its size is not judged without a running time'] };
  }

  if (isVideo && parsed.seasons.length > 0 && parsed.episodes.length === 0) {
    return { ...nothing, reasons: ['Its size is not judged, since it is a whole season'] };
  }

  const hours = ((runtimeMinutes ?? 60) * Math.max(parsed.episodes.length, 1)) / 60;
  const measured = isVideo ? megabytes / hours : megabytes;
  const said = `${Math.round(measured).toLocaleString('en-GB')} MB${isVideo ? ' an hour' : ''}`;

  const quality =
    ownSize === undefined
      ? ''
      : ` for ${QUALITY_LABELS[ownSize.resolution]} from ${QUALITY_LABELS[ownSize.source]}`;

  if (largest !== null && measured > largest) {
    return {
      ...nothing,
      rejections: [
        `At ${said} it is larger than this profile takes${quality}, ${largest.toLocaleString('en-GB')}`,
      ],
    };
  }

  if (smallest !== null && measured < smallest) {
    return {
      ...nothing,
      rejections: [
        `At ${said} it is smaller than this profile takes${quality}, ${smallest.toLocaleString('en-GB')}`,
      ],
    };
  }

  return nothing;
};

/**
 * Judges a release against a quality profile: whether it may be taken at all, and if so how well it
 * fits — its resolution and source for video, or its encoding for music, each by how far up the
 * profile's list it comes, with preferred words and a proper or repack on top. Everything that
 * refused it, and everything that scored, is said in words.
 *
 * A release that does not say its resolution, or for music its encoding, is refused, since a
 * profile is chiefly about those. One that does not say its source is let through unscored, as
 * anime releases seldom do. A torrent nobody seeds is refused, since it would never arrive.
 *
 * @param release - The release.
 * @param parsed - What its name says.
 * @param profile - The profile.
 * @param runtimeMinutes - How long one film or episode runs, for judging video by size an hour.
 * @returns The judgement.
 */
const judgeRelease = (
  release: Release,
  parsed: ParsedRelease,
  profile: QualityProfile,
  runtimeMinutes?: number,
): Judgement => {
  const verdicts: Verdict[] =
    profile.kind === 'video'
      ? [
          judgeChoice(
            parsed.resolution,
            profile.resolutions,
            1000,
            'It does not say its resolution',
          ),
          judgeChoice(parsed.source, profile.sources, 100, null),
        ]
      : [
          judgeChoice(
            parsed.musicQuality,
            profile.musicQualities,
            1000,
            'It does not say how it was encoded',
          ),
        ];
  const banned = profile.bannedWords.filter((word) => hasWord(release.title, word));
  const preferred = profile.preferredWords.filter((word) => hasWord(release.title, word));
  const isMissingRequired =
    profile.requiredWords.length > 0 &&
    !profile.requiredWords.some((word) => hasWord(release.title, word));

  verdicts.push(
    {
      score: 0,
      rejections: [
        ...banned.map((word) => `It has “${word}”, which is banned`),
        ...(isMissingRequired
          ? [`It has none of the words it must: ${profile.requiredWords.join(', ')}`]
          : []),
        ...(release.protocol === 'torrent' && release.seeders === 0
          ? ['Nobody is seeding it']
          : []),
      ],
      reasons: [],
    },
    {
      score: preferred.length * PREFERRED_WORD,
      rejections: [],
      reasons: preferred.map((word) => `It has “${word}” (+${PREFERRED_WORD.toString()})`),
    },
    {
      score: parsed.isProper || parsed.isRepack ? REVISION : 0,
      rejections: [],
      reasons: parsed.isProper
        ? [`A proper, a better release of the same thing (+${REVISION.toString()})`]
        : parsed.isRepack
          ? [`A repack, fixing an earlier release (+${REVISION.toString()})`]
          : [],
    },
    judgeSize(release, parsed, profile, runtimeMinutes),
  );

  const rejections = verdicts.flatMap((verdict) => verdict.rejections);

  return {
    releaseId: release.id,
    parsed,
    score: verdicts.reduce((total, verdict) => total + verdict.score, 0),
    isRejected: rejections.length > 0,
    rejections,
    reasons: verdicts.flatMap((verdict) => verdict.reasons),
  };
};

export { judgeRelease };
