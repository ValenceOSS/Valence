import { describeLanguage } from '@ValenceCore/functions/describeTrack';
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

const LANGUAGE = 50;

/**
 * Judges a release against the language wanted, where one is wanted.
 *
 * Three answers rather than two, because a release name that says nothing about language is the
 * common case and must not be read either way. Most English releases never say they are English,
 * so scoring silence as a miss would bury them; scoring it as a hit would rank an English dub
 * above the Japanese original of a film that has no dub. Silence scores nothing.
 *
 * Never a rejection. Wanting English is a preference about which release to take, not a claim that
 * a film has an English version, and a profile that refused everything else would leave a foreign
 * film unfetchable.
 *
 * @param languages - The languages the release name says it carries.
 * @param wanted - The language wanted, or null where none is.
 * @returns The verdict.
 */
const judgeLanguage = (languages: readonly string[], wanted: string | null): Verdict => {
  if (wanted === null || languages.length === 0) {
    return { score: 0, rejections: [], reasons: [] };
  }

  const name = describeLanguage(wanted) ?? wanted;

  return languages.includes(wanted)
    ? { score: LANGUAGE, rejections: [], reasons: [`In ${name} (+${LANGUAGE.toString()})`] }
    : {
        score: -LANGUAGE,
        rejections: [],
        reasons: [`Not in ${name} (−${LANGUAGE.toString()})`],
      };
};

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
 * the profile's own — which needs its running time.
 *
 * A pack is judged per hour like anything else, over however many episodes it holds. Where nobody
 * has said how many that is, as an interactive search has not, it goes unjudged rather than being
 * measured against one episode's limit and refused for being a pack.
 *
 * @param release - The release.
 * @param parsed - What its name says.
 * @param profile - The profile.
 * @param runtimeMinutes - How long one film or episode runs, where known.
 * @param episodesHeld - How many episodes it holds, where that is known.
 * @returns The verdict.
 */
const judgeSize = (
  release: Release,
  parsed: ParsedRelease,
  profile: QualityProfile,
  runtimeMinutes: number | undefined,
  episodesHeld: number | undefined,
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

  const isPack = isVideo && parsed.seasons.length > 0 && parsed.episodes.length === 0;
  const held = parsed.episodes.length > 0 ? parsed.episodes.length : (episodesHeld ?? 0);

  if (isPack && held === 0) {
    return { ...nothing, reasons: ['Its size is not judged without knowing what it holds'] };
  }

  const hours = ((runtimeMinutes ?? 60) * Math.max(held, 1)) / 60;
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
 * The language a profile prefers only ranks releases, and never refuses one. See [`judgeLanguage`].
 *
 * @param release - The release.
 * @param parsed - What its name says.
 * @param profile - The profile.
 * @param runtimeMinutes - How long one film or episode runs, for judging video by size an hour.
 * @param episodesHeld - How many episodes the release holds, so a pack is judged by size an hour
 *   like anything else. Left out where nobody knows, and then a pack's size goes unjudged.
 * @param isForABook - Whether it is for a book or an audiobook, which says nothing of a resolution
 *   or an encoding and is judged by its words alone; a video is refused outright.
 * @returns The judgement.
 */
const judgeRelease = (
  release: Release,
  parsed: ParsedRelease,
  profile: QualityProfile,
  runtimeMinutes?: number,
  episodesHeld?: number,
  isForABook = false,
): Judgement => {
  const verdicts: Verdict[] = isForABook
    ? [
        {
          score: 0,
          rejections:
            parsed.resolution === null && parsed.codec === null
              ? []
              : ['It is a video, not a book'],
          reasons: [],
        },
      ]
    : profile.kind === 'video'
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
          {
            score: 0,
            rejections:
              parsed.resolution === null && parsed.codec === null
                ? []
                : ['It is a video, not music'],
            reasons: [],
          },
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
    judgeLanguage(parsed.languages, profile.preferredLanguage),
    ...(isForABook ? [] : [judgeSize(release, parsed, profile, runtimeMinutes, episodesHeld)]),
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
