import { saying } from '@ValenceI18n/saying';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Said } from '@ValenceI18n/SaidSchema';
import {
  MUSIC_QUALITIES,
  RELEASE_SOURCES,
  RESOLUTIONS,
} from '@ValenceContracts/schemas/ParsedRelease';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';
import { VIDEO_QUALITIES } from '@ValenceContracts/schemas/QualityProfile';
import type { ProfileKind, QualityProfileDraft } from '@ValenceContracts/schemas/QualityProfile';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { musicQualityOf } from '@ValenceRequests/arrImport/musicQualityOf';
import { termAsWord } from '@ValenceRequests/arrImport/termAsWord';
import { videoQualityOf } from '@ValenceRequests/arrImport/videoQualityOf';
import type { VideoQuality } from '@ValenceRequests/arrImport/videoQualityOf';
import { wordsOfCustomFormat } from '@ValenceRequests/arrImport/wordsOfCustomFormat';
import type {
  ArrQuality,
  ArrQualityItem,
  ArrQualityProfile,
} from '@ValenceRequests/arrImport/schemas/ArrQualityProfileSchema';

const MOST_WORDS = 50;

type Words = { preferred: string[]; required: string[]; banned: string[] };

/**
 * The qualities one entry of a profile stands for: itself, or every quality in it where it is a
 * group.
 *
 * @param item - The entry.
 * @returns Its qualities.
 */
const qualitiesIn = (item: ArrQualityItem): ArrQuality[] =>
  item.items.length > 0
    ? item.items.flatMap((leaf) =>
        leaf.quality === null || leaf.quality === undefined ? [] : [leaf.quality],
      )
    : item.quality === null || item.quality === undefined
      ? []
      : [item.quality];

/**
 * The entry a profile upgrades until: the group or quality its cutoff names.
 *
 * @param profile - The profile.
 * @returns The entry, or none.
 */
const cutoffOf = (profile: ArrQualityProfile): ArrQualityItem | undefined =>
  profile.cutoff === null || profile.cutoff === undefined
    ? undefined
    : (profile.items.find((item) => item.items.length > 0 && item.id === profile.cutoff) ??
      profile.items.find((item) => item.items.length === 0 && item.quality?.id === profile.cutoff));

/**
 * The best of some video qualities, in the order Valence ranks them.
 *
 * @param qualities - The qualities.
 * @returns The best, or none.
 */
const bestVideo = (qualities: readonly VideoQuality[]): VideoQuality | undefined =>
  qualities.toSorted((left, right) => {
    const rank = (quality: VideoQuality) => {
      const found = VIDEO_QUALITIES.findIndex(
        (one) => one.source === quality.source && one.resolution === quality.resolution,
      );

      return found === -1
        ? VIDEO_QUALITIES.length + RELEASE_SOURCES.indexOf(quality.source)
        : found;
    };

    return rank(left) - rank(right);
  })[0];

/**
 * Says which qualities a profile allows that Valence has no equivalent for, where there are any.
 *
 * @param unmatched - Their names.
 * @param notes - Where to say it.
 */
const sayUnmatched = (unmatched: ReadonlySet<string>, notes: Said[]): void => {
  const [first, ...others] = [...unmatched];

  if (first !== undefined) {
    notes.push(
      saying('requests.arrImport.valenceHasNoMatchForQualities', {
        qualities: sayingAll([first, ...others]),
      }),
    );
  }
};

/**
 * The words a profile prefers, needs and refuses, from the custom formats it scores and the release
 * profiles that hold for every series, with what could only be approximated or left out said.
 *
 * @param profile - The profile.
 * @param setup - The app it is from.
 * @param notes - Where to say what was approximated or left out.
 * @returns The words.
 */
const wordsOf = (profile: ArrQualityProfile, setup: ArrSetup, notes: Said[]): Words => {
  const words: Words = { preferred: [], required: [], banned: [] };

  for (const item of profile.formatItems.filter((one) => one.score !== 0)) {
    const format = setup.customFormats.find((one) => one.id === item.format);
    const name = format?.name ?? item.name ?? item.format.toString();
    const read = format === undefined ? null : wordsOfCustomFormat(format);

    if (read === null) {
      notes.push(saying('requests.arrImport.customFormatNameWasLeftOut', { name }));
      continue;
    }

    if (read.isApproximate) {
      notes.push(saying('requests.arrImport.customFormatNameWasApproximated', { name }));
    }

    (item.score > 0 ? words.preferred : words.banned).push(...read.words);
  }

  if (profile.minFormatScore > 0) {
    notes.push(
      saying('requests.arrImport.aLeastFormatScoreWasLeftOut', {
        score: profile.minFormatScore.toString(),
      }),
    );
  }

  for (const release of setup.releaseProfiles.filter((one) => one.enabled)) {
    if (release.tags.length > 0) {
      notes.push(
        saying('requests.arrImport.releaseProfileNameHoldsForTaggedOnly', {
          name: release.name ?? release.id.toString(),
        }),
      );
      continue;
    }

    const asWords = (terms: readonly string[]) =>
      terms.map((term) => termAsWord(term, false)).filter((word): word is string => word !== null);

    words.required.push(...asWords(release.required));
    words.banned.push(...asWords(release.ignored));
    words.preferred.push(
      ...asWords(release.preferred.filter((one) => one.value > 0).map((one) => one.key)),
    );
    words.banned.push(
      ...asWords(release.preferred.filter((one) => one.value < 0).map((one) => one.key)),
    );
  }

  const trimmed = {
    preferred: [...new Set(words.preferred)],
    required: [...new Set(words.required)],
    banned: [...new Set(words.banned)],
  };

  if (Object.values(trimmed).some((list) => list.length > MOST_WORDS)) {
    notes.push(saying('requests.arrImport.onlyTheFirstFiftyWordsWereKept'));
  }

  return {
    preferred: trimmed.preferred.slice(0, MOST_WORDS),
    required: trimmed.required.slice(0, MOST_WORDS),
    banned: trimmed.banned.slice(0, MOST_WORDS),
  };
};

/**
 * A Radarr, Sonarr or Lidarr quality profile as a Valence one: the qualities it allows as Valence's
 * resolutions and sources, or its music qualities; its cutoff as what to upgrade until; whether it
 * upgrades; and its custom formats and release profiles as preferred, required and banned words —
 * saying what could only be approximated and what was left out.
 *
 * @param profile - The profile.
 * @param kind - Whether it judges video or music.
 * @param setup - The app it is from.
 * @returns The profile to make, and what was said of it.
 */
const profileOf = (
  profile: ArrQualityProfile,
  kind: ProfileKind,
  setup: ArrSetup,
): { draft: QualityProfileDraft; notes: Said[] } => {
  const notes: Said[] = [];
  const allowed = profile.items.filter((item) => item.allowed).flatMap(qualitiesIn);
  const unknown = new Set<string>();
  const cutoff = cutoffOf(profile);
  const words = wordsOf(profile, setup, notes);
  const base = {
    name: profile.name.trim().slice(0, 80),
    kind,
    preferredWords: words.preferred,
    requiredWords: words.required,
    bannedWords: words.banned,
  };

  if (kind === 'music') {
    const music = allowed.flatMap((quality) => {
      const read = musicQualityOf(quality.name);

      if (read === null) {
        unknown.add(quality.name);
      }

      return read === null ? [] : [read];
    });
    const until = (cutoff === undefined ? [] : qualitiesIn(cutoff))
      .map((quality) => musicQualityOf(quality.name))
      .filter((quality): quality is MusicQuality => quality !== null)
      .toSorted((left, right) => MUSIC_QUALITIES.indexOf(left) - MUSIC_QUALITIES.indexOf(right))[0];

    sayUnmatched(unknown, notes);

    if (music.length === 0) {
      notes.push(saying('requests.arrImport.noQualityMatchedSoValencesDefaultsHold'));
    }

    return {
      draft: {
        ...base,
        ...(music.length === 0
          ? {}
          : { musicQualities: MUSIC_QUALITIES.filter((quality) => music.includes(quality)) }),
        isUpgrading: profile.upgradeAllowed && until !== undefined,
        upgradeUntilMusicQuality: profile.upgradeAllowed ? (until ?? null) : null,
      },
      notes,
    };
  }

  const video = allowed.flatMap((quality) => {
    const read = videoQualityOf(quality.name);

    if (read === null) {
      unknown.add(quality.name);
    }

    return read === null ? [] : [read];
  });
  const until = bestVideo(
    (cutoff === undefined ? [] : qualitiesIn(cutoff))
      .map((quality) => videoQualityOf(quality.name))
      .filter((quality): quality is VideoQuality => quality !== null),
  );
  const resolutions = RESOLUTIONS.filter((resolution) =>
    video.some((quality) => quality.resolution === resolution),
  );
  const sources = RELEASE_SOURCES.filter((source) =>
    video.some((quality) => quality.source === source),
  );
  const isWider = VIDEO_QUALITIES.some(
    (one) =>
      resolutions.includes(one.resolution) &&
      sources.includes(one.source) &&
      !video.some(
        (quality) => quality.source === one.source && quality.resolution === one.resolution,
      ),
  );

  sayUnmatched(unknown, notes);

  if (isWider) {
    notes.push(saying('requests.arrImport.everyResolutionIsTakenFromEverySource'));
  }

  if (video.length === 0) {
    notes.push(saying('requests.arrImport.noQualityMatchedSoValencesDefaultsHold'));
  }

  return {
    draft: {
      ...base,
      ...(video.length === 0 ? {} : { resolutions, sources }),
      isUpgrading: profile.upgradeAllowed && until !== undefined,
      upgradeUntilResolution: profile.upgradeAllowed ? (until?.resolution ?? null) : null,
      upgradeUntilSource: profile.upgradeAllowed ? (until?.source ?? null) : null,
    },
    notes,
  };
};

export { profileOf };
