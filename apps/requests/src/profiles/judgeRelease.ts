import { judgeBookFormat } from '@ValenceRequests/profiles/judgeBookFormat';
import { describeLanguage } from '@ValenceCore/functions/describeTrack';
import { hasWord } from '@ValenceRequests/profiles/hasWord';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import { QUALITY_NAMES } from '@ValenceRequests/profiles/QUALITY_NAMES';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import { placeOfVideoQuality } from '@ValenceRequests/profiles/placeOfVideoQuality';
import { formatScoreOf } from '@ValenceRequests/profiles/formatScoreOf';
import { videoQualityIdOf } from '@ValenceContracts/functions/videoQualityIdOf';
import { nameVideoQuality } from '@ValenceRequests/profiles/nameVideoQuality';
import type { MusicQuality, ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type {
  Judgement,
  QualityProfile,
  VideoQualityId,
} from '@ValenceContracts/schemas/QualityProfile';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { StringKey } from '@ValenceI18n/StringKey';

type Verdict = { score: number; quality?: number; rejections: Said[]; reasons: Said[] };

const CHOICES: readonly StringKey[] = [
  'requests.profiles.judgeRelease.firstChoice',
  'requests.profiles.judgeRelease.secondChoice',
  'requests.profiles.judgeRelease.thirdChoice',
  'requests.profiles.judgeRelease.fourthChoice',
  'requests.profiles.judgeRelease.fifthChoice',
];

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
    ? {
        score: LANGUAGE,
        rejections: [],
        reasons: [saying('requests.profiles.judgeRelease.inLanguage', { name, points: LANGUAGE })],
      }
    : {
        score: -LANGUAGE,
        rejections: [],
        reasons: [
          saying('requests.profiles.judgeRelease.notInLanguage', { name, points: LANGUAGE }),
        ],
      };
};

/**
 * Says where a quality comes in a profile's list, best first.
 *
 * @param quality - The quality, in words.
 * @param place - Its place, from nought.
 * @returns The reason.
 */
const choiceOf = (quality: Said, place: number): Said => {
  const choice = CHOICES[place];

  return choice === undefined
    ? saying('requests.profiles.judgeRelease.laterChoice', { quality, number: place + 1 })
    : saying(choice, { quality });
};

/**
 * Judges a video's quality against the profile's list of qualities, best first: its place on the
 * list is its quality, the first the best, and anything off the list is refused. A release that
 * does not say its source is taken as the lowest quality the profile takes at its resolution, as
 * anime releases seldom say; one that does not say its resolution is refused.
 *
 * @param parsed - What its name says.
 * @param qualities - What the profile takes, best first.
 * @returns The verdict.
 */
const judgeVideoQuality = (
  parsed: Pick<ParsedRelease, 'source' | 'resolution'>,
  qualities: readonly VideoQualityId[],
): Verdict => {
  const id = videoQualityIdOf(parsed.source, parsed.resolution);

  if (id === null && parsed.resolution === null) {
    return {
      score: 0,
      rejections: [saying('requests.profiles.judgeRelease.itDoesNotSayItsResolution')],
      reasons: [],
    };
  }

  const place = placeOfVideoQuality(parsed, qualities);
  const placed = place === null ? undefined : qualities[place];

  if (place === null || placed === undefined) {
    return {
      score: 0,
      rejections: [
        saying('requests.profiles.judgeRelease.notTaken', {
          quality: id === null ? QUALITY_NAMES[parsed.resolution ?? '1080p'] : nameVideoQuality(id),
        }),
      ],
      reasons: [],
    };
  }

  return {
    score: 0,
    quality: qualities.length - place,
    rejections: [],
    reasons: [
      id === null
        ? saying('requests.profiles.judgeRelease.itDoesNotSayItsSource', {
            quality: nameVideoQuality(placed),
          })
        : choiceOf(nameVideoQuality(id), place),
    ],
  };
};

/**
 * Judges music's encoding against the profile's list, best first: its place on the list is its
 * quality, and anything off the list, or an encoding its name does not give, is refused.
 *
 * @param value - Its encoding, or null where its name does not say.
 * @param choices - What the profile takes, best first.
 * @returns The verdict.
 */
const judgeMusicQuality = (
  value: MusicQuality | null,
  choices: readonly MusicQuality[],
): Verdict => {
  if (value === null) {
    return {
      score: 0,
      rejections: [saying('requests.profiles.judgeRelease.itDoesNotSayHowIt')],
      reasons: [],
    };
  }

  const place = choices.indexOf(value);
  const quality = QUALITY_NAMES[value];

  return place === -1
    ? {
        score: 0,
        rejections: [saying('requests.profiles.judgeRelease.notTaken', { quality })],
        reasons: [],
      }
    : {
        score: 0,
        quality: choices.length - place,
        rejections: [],
        reasons: [choiceOf(quality, place)],
      };
};

/**
 * Judges a release by the profile's custom formats: the scores of those it matches, each said, and
 * a refusal where they come to less than the profile's minimum.
 *
 * @param release - The release.
 * @param parsed - What its name says.
 * @param profile - The profile.
 * @returns The verdict.
 */
const judgeFormats = (
  release: Pick<Release, 'title' | 'sizeBytes'>,
  parsed: ParsedRelease,
  profile: Pick<QualityProfile, 'formats' | 'minFormatScore'>,
): Verdict => {
  const { score, matched } = formatScoreOf(release, parsed, profile.formats);
  const signed = (points: number) =>
    `${points > 0 ? '+' : points < 0 ? '−' : ''}${Math.abs(points).toString()}`;

  return {
    score,
    rejections:
      score < profile.minFormatScore
        ? [
            saying('requests.profiles.judgeRelease.formatScoreUnderMinimum', {
              score: score.toString(),
              minimum: profile.minFormatScore.toString(),
            }),
          ]
        : [],
    reasons: matched.map((format) =>
      saying('requests.profiles.judgeRelease.matchesFormat', {
        name: format.name,
        points: signed(format.score),
      }),
    ),
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
    return {
      ...nothing,
      reasons: [saying('requests.profiles.judgeRelease.itsSizeIsNotJudgedWithout2')],
    };
  }

  const isPack = isVideo && parsed.seasons.length > 0 && parsed.episodes.length === 0;
  const held = parsed.episodes.length > 0 ? parsed.episodes.length : (episodesHeld ?? 0);

  if (isPack && held === 0) {
    return {
      ...nothing,
      reasons: [saying('requests.profiles.judgeRelease.itsSizeIsNotJudgedWithout')],
    };
  }

  const hours = ((runtimeMinutes ?? 60) * Math.max(held, 1)) / 60;
  const measured = isVideo ? megabytes / hours : megabytes;
  const size = Math.round(measured).toLocaleString('en-GB');
  const outOfBounds = (limit: number, isLarger: boolean): Said => {
    const values = { size, limit: limit.toLocaleString('en-GB') };

    if (!isVideo) {
      return saying(
        isLarger
          ? 'requests.profiles.judgeRelease.larger'
          : 'requests.profiles.judgeRelease.smaller',
        values,
      );
    }

    return ownSize === undefined
      ? saying(
          isLarger
            ? 'requests.profiles.judgeRelease.largerAnHour'
            : 'requests.profiles.judgeRelease.smallerAnHour',
          values,
        )
      : saying(
          isLarger
            ? 'requests.profiles.judgeRelease.largerAnHourFor'
            : 'requests.profiles.judgeRelease.smallerAnHourFor',
          {
            ...values,
            resolution: QUALITY_LABELS[ownSize.resolution],
            source: QUALITY_LABELS[ownSize.source],
          },
        );
  };

  if (largest !== null && measured > largest) {
    return { ...nothing, rejections: [outOfBounds(largest, true)] };
  }

  if (smallest !== null && measured < smallest) {
    return { ...nothing, rejections: [outOfBounds(smallest, false)] };
  }

  return nothing;
};

/**
 * Judges a release against a quality profile: whether it may be taken at all, and if so how well it
 * fits — its quality, by how far up the profile's list of combined qualities (or for music, of
 * encodings) it comes, and apart from that a score for its preferred words, a proper or repack, its
 * language and the custom formats it matches, refused where those formats come to less than the
 * profile's minimum. Everything that refused it, and everything that counted, is said in words.
 *
 * A release that does not say its resolution, or for music its encoding, is refused, since a
 * profile is chiefly about those. One that does not say its source is taken as the lowest quality
 * the profile takes at its resolution, as anime releases seldom say. A torrent nobody seeds is
 * refused, since it would never arrive.
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
 *   or an encoding and is judged by its words and its format; a video is refused outright.
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
              : [saying('requests.profiles.judgeRelease.itIsAVideoNotA')],
          reasons: [],
        },
      ]
    : profile.kind === 'video'
      ? [judgeVideoQuality(parsed, profile.qualities)]
      : [
          {
            score: 0,
            rejections:
              parsed.resolution === null && parsed.codec === null
                ? []
                : [saying('requests.profiles.judgeRelease.itIsAVideoNotMusic')],
            reasons: [],
          },
          judgeMusicQuality(parsed.musicQuality, profile.musicQualities),
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
        ...banned.map((word) =>
          saying('requests.profiles.judgeRelease.itHasWordWhichIsBanned', { word }),
        ),
        ...(isMissingRequired
          ? [
              saying('requests.profiles.judgeRelease.missingRequiredWords', {
                words: profile.requiredWords.join(', '),
              }),
            ]
          : []),
        ...(release.protocol === 'torrent' && release.seeders === 0
          ? [saying('requests.profiles.judgeRelease.nobodyIsSeedingIt')]
          : []),
      ],
      reasons: [],
    },
    {
      score: preferred.length * PREFERRED_WORD,
      rejections: [],
      reasons: preferred.map((word) =>
        saying('requests.profiles.judgeRelease.hasPreferredWord', { word, points: PREFERRED_WORD }),
      ),
    },
    {
      score: parsed.isProper || parsed.isRepack ? REVISION : 0,
      rejections: [],
      reasons: parsed.isProper
        ? [saying('requests.profiles.judgeRelease.proper', { points: REVISION })]
        : parsed.isRepack
          ? [saying('requests.profiles.judgeRelease.repack', { points: REVISION })]
          : [],
    },
    judgeLanguage(parsed.languages, profile.preferredLanguage),
    judgeFormats(release, parsed, profile),
    ...(isForABook
      ? [judgeBookFormat(release)]
      : [judgeSize(release, parsed, profile, runtimeMinutes, episodesHeld)]),
  );

  const rejections = verdicts.flatMap((verdict) => verdict.rejections);

  return {
    releaseId: release.id,
    parsed,
    quality: verdicts.reduce((total, verdict) => total + (verdict.quality ?? 0), 0),
    score: verdicts.reduce((total, verdict) => total + verdict.score, 0),
    isRejected: rejections.length > 0,
    rejections,
    reasons: verdicts.flatMap((verdict) => verdict.reasons),
  };
};

export { judgeRelease };
