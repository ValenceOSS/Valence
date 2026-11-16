import { eq } from 'drizzle-orm';
import { reportingTrouble } from '@ValenceServer/sources/reportingTrouble';
import { library, mediaItem, series } from '#dialect/Schema';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { readLanguage } from '@ValenceCore/functions/describeTrack';
import { fetchOpenSubtitle } from './fetchOpenSubtitle';
import { fetchSubdlSubtitle } from './fetchSubdlSubtitle';
import { openSubtitlesHash } from './openSubtitlesHash';
import { searchOpenSubtitles } from './searchOpenSubtitles';
import { rankSubtitles } from './rankSubtitles';
import { bazarrMinimumOf } from './bazarrMinimumOf';
import { scoreSubtitle } from './scoreSubtitle';
import { subtitleVideoOf } from './subtitleVideoOf';
import { searchSubdl } from './searchSubdl';
import { z } from 'zod';
import { SUBTITLE_SOURCES } from '@ValenceContracts/constants/SUBTITLE_SOURCES';
import { AudioStreamSchema } from '@ValenceContracts/schemas/MediaItem';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import {
  SUBTITLE_DEFAULTS,
  SubtitleSettingsSchema,
} from '@ValenceContracts/schemas/SubtitleSettings';
import type { SubtitleSettings } from '@ValenceContracts/schemas/SubtitleSettings';
import type { FoundSubtitle, SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';
import type { FetchedSubtitleStore } from './createFetchedSubtitleStore';
import type { SubtitleFinder } from './SubtitleFinder';
import type { SubtitleLookup } from './SubtitleLookup';

const REMEMBERED_SEARCHES = 50;

type SubtitleFinderOptions = {
  db: AnyValenceDatabase;
  settings: SettingsStore;
  store: FetchedSubtitleStore;
  fetchImpl?: typeof fetch;
  canWriteSubtitles?: () => Promise<boolean>;
  releaseOf?: (path: string) => Promise<string | null>;
};

/**
 * What the settings say of finding subtitles, without the keys and password themselves.
 *
 * @param saved - The settings.
 * @param canWriteSubtitles - Whether the media service has Whisper to write subtitles with.
 * @returns What an administrator is shown.
 */
const setupOf = (saved: SubtitleSettings, canWriteSubtitles: boolean): SubtitleSetup => ({
  hasOpenSubtitlesKey: saved.openSubtitlesKey !== '',
  openSubtitlesUsername: saved.openSubtitlesUsername,
  hasOpenSubtitlesPassword: saved.openSubtitlesPassword !== '',
  hasSubdlKey: saved.subdlKey !== '',
  languages: saved.languages,
  isAutomatic: saved.isAutomatic,
  filmMinimumScore: saved.filmMinimumScore,
  episodeMinimumScore: saved.episodeMinimumScore,
  writesSubtitles: saved.writesSubtitles,
  whisperModel: saved.whisperModel,
  whisperLanguage: saved.whisperLanguage,
  translatesToEnglish: saved.translatesToEnglish,
  canWriteSubtitles,
});

/**
 * Finds subtitles for a film or episode on OpenSubtitles and SubDL, scored against the file they are
 * for, and keeps the one chosen inside Valence's own data rather than among the media, where every
 * player lists it beside the file's own tracks the next time it is played. A subtitle fetched in a
 * language replaces the one fetched before in it.
 *
 * Set to fetch on its own, it looks for each of the household's languages a file has no subtitle in
 * of its own, and takes the best only where it scores at least the minimum for a film or an episode,
 * was timed to the file's frame rate and was not translated by a machine — never one it can't vouch
 * for. One it fetched before is swapped for a better one when a better one turns up, the one it has
 * scored again by its release name, so one kept under an older way of scoring is weighed fairly.
 *
 * Each site needs its own key, entered by an administrator, since downloads are allowed per key and
 * per account. A site with no key is not asked.
 *
 * A file is matched by the release it came from where the requests service filed it and knows
 * that, as Bazarr matches by the scene name Radarr or Sonarr kept, and otherwise by its own name.
 *
 * @param options - The database, the settings the keys are kept in, the way out to the web, and
 *   how to ask which release a file came from.
 * @returns The finder.
 */
const createSubtitleFinder = ({
  db,
  settings,
  store,
  fetchImpl = fetch,
  canWriteSubtitles = () => Promise.resolve(false),
  releaseOf = () => Promise.resolve(null),
}: SubtitleFinderOptions): SubtitleFinder => {
  const saved = async () =>
    SubtitleSettingsSchema.catch(SUBTITLE_DEFAULTS).parse((await settings.read()).subtitles);
  const canWrite = () => canWriteSubtitles().catch(() => false);
  const lastFound = new Map<string, FoundSubtitle[]>();

  const read = async (mediaId: string) => {
    const [row] = await db
      .select({
        path: mediaItem.path,
        externalId: mediaItem.externalId,
        imdbId: mediaItem.imdbId,
        seriesTitle: mediaItem.seriesTitle,
        season: mediaItem.seasonNumber,
        episode: mediaItem.episodeNumber,
        frameRate: mediaItem.videoFrameRate,
        width: mediaItem.width,
        height: mediaItem.height,
        videoCodec: mediaItem.videoCodec,
        audioStreams: mediaItem.audioStreams,
        seriesExternalId: series.externalId,
        root: library.path,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(series, eq(series.id, mediaItem.seriesId))
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    return row ?? null;
  };

  const videoOf = async (row: NonNullable<Awaited<ReturnType<typeof read>>>) => {
    const release = await releaseOf(row.path).catch(() => null);
    const streams = z.array(AudioStreamSchema).catch([]).parse(row.audioStreams);
    const audio = streams.find((stream) => stream.isDefault) ?? streams[0] ?? null;

    return subtitleVideoOf({
      path: row.path,
      release,
      isEpisode: row.seriesTitle !== null,
      season: row.season,
      episode: row.episode,
      frameRate: row.frameRate,
      width: row.width,
      height: row.height,
      videoCodec: row.videoCodec,
      audioCodec: audio?.codec ?? null,
      audioProfile: audio?.profile ?? null,
    });
  };

  const lookupOf = async (
    row: NonNullable<Awaited<ReturnType<typeof read>>>,
    language: string,
  ): Promise<SubtitleLookup> => {
    const isEpisode = row.seriesTitle !== null;
    const tmdbId = Number(isEpisode ? row.seriesExternalId : row.externalId);

    return {
      kind: isEpisode ? 'episode' : 'movie',
      tmdbId: Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null,
      imdbId: isEpisode ? null : row.imdbId,
      season: row.season,
      episode: row.episode,
      hash: await openSubtitlesHash(row.path),
      language,
    };
  };

  const finder: SubtitleFinder = {
    setup: async () => setupOf(await saved(), await canWrite()),

    change: async (change) => {
      const was = await saved();
      const forgets = new Set(change.forget ?? []);
      const kept = (
        field: 'openSubtitlesKey' | 'openSubtitlesPassword' | 'subdlKey',
        given: string | undefined,
      ) => (forgets.has(field) ? '' : given === undefined || given === '' ? was[field] : given);
      const next: SubtitleSettings = {
        openSubtitlesKey: kept('openSubtitlesKey', change.openSubtitlesKey),
        openSubtitlesUsername: change.openSubtitlesUsername,
        openSubtitlesPassword: kept('openSubtitlesPassword', change.openSubtitlesPassword),
        subdlKey: kept('subdlKey', change.subdlKey),
        languages: [...new Set(change.languages.map((language) => language.toLowerCase()))],
        isAutomatic: change.isAutomatic ?? false,
        filmMinimumScore: change.filmMinimumScore ?? 70,
        episodeMinimumScore: change.episodeMinimumScore ?? 90,
        writesSubtitles: change.writesSubtitles ?? false,
        whisperModel: change.whisperModel ?? 'base',
        whisperLanguage: change.whisperLanguage?.toLowerCase() ?? null,
        translatesToEnglish: change.translatesToEnglish ?? false,
        scale: 'bazarr',
      };

      return setupOf(
        SubtitleSettingsSchema.catch(SUBTITLE_DEFAULTS).parse(
          (await settings.write({ subtitles: next })).subtitles,
        ),
        await canWrite(),
      );
    },

    finding: async (mediaId) => {
      if ((await read(mediaId)) === null) {
        return null;
      }

      const keys = await saved();
      const sites = SUBTITLE_SOURCES.filter((site) =>
        site === 'opensubtitles' ? keys.openSubtitlesKey !== '' : keys.subdlKey !== '',
      );

      return {
        state: sites.length === 0 ? 'notSetUp' : 'ready',
        sites,
        languages: keys.languages,
        server: null,
      };
    },

    search: async (mediaId, language) => {
      const row = await read(mediaId);

      if (row === null) {
        return null;
      }

      const keys = await saved();
      const isSetUp = keys.openSubtitlesKey !== '' || keys.subdlKey !== '';

      if (!isSetUp) {
        return { subtitles: [], isSetUp };
      }

      const lookup = await lookupOf(row, language.toLowerCase());
      const asking = reportingTrouble(fetchImpl);
      const [opened, subdl] = await Promise.all([
        keys.openSubtitlesKey === ''
          ? []
          : searchOpenSubtitles(keys.openSubtitlesKey, lookup, asking),
        keys.subdlKey === '' ? [] : searchSubdl(keys.subdlKey, lookup, asking),
      ]);

      const ranked = rankSubtitles(await videoOf(row), [...opened, ...subdl]);

      lastFound.delete(mediaId);
      lastFound.set(mediaId, ranked);

      if (lastFound.size > REMEMBERED_SEARCHES) {
        lastFound.delete(lastFound.keys().next().value ?? mediaId);
      }

      return { subtitles: ranked, isSetUp };
    },

    fetch: async (mediaId, choice) => {
      const row = await read(mediaId);

      if (row === null || !isUnderAny(row.path, [row.root])) {
        return { kind: 'absent' };
      }

      const keys = await saved();
      const downloaded =
        choice.source === 'opensubtitles'
          ? keys.openSubtitlesKey === ''
            ? undefined
            : await fetchOpenSubtitle(
                {
                  key: keys.openSubtitlesKey,
                  username: keys.openSubtitlesUsername,
                  password: keys.openSubtitlesPassword,
                },
                choice.id,
                fetchImpl,
              )
          : keys.subdlKey === ''
            ? undefined
            : await fetchSubdlSubtitle(
                choice.id,
                row.seriesTitle === null || row.season === null || row.episode === null
                  ? null
                  : { season: row.season, episode: row.episode },
                fetchImpl,
              );

      if (downloaded === undefined) {
        return { kind: 'notSetUp' };
      }

      if (downloaded === null) {
        return { kind: 'unavailable' };
      }

      if (downloaded.kind === 'otherEpisode') {
        return { kind: 'otherEpisode' };
      }

      const found = lastFound
        .get(mediaId)
        ?.find((one) => one.source === choice.source && one.id === choice.id);

      try {
        const kept = await store.save(
          mediaId,
          {
            language: choice.language.toLowerCase(),
            source: choice.source,
            id: choice.id,
            release: found?.name ?? '',
            score: found?.score ?? 0,
            scale: 'bazarr',
            isHearingImpaired: found?.isHearingImpaired ?? false,
            format: downloaded.extension,
          },
          downloaded.bytes,
        );

        return { kind: 'fetched', name: kept.file };
      } catch (error) {
        const refusal = diskRefusalOf(error instanceof Error ? error : null);

        return refusal.kind === 'missing' ? { kind: 'failed' } : refusal;
      }
    },

    fetchWanted: async (mediaId, own) => {
      const keys = await saved();

      if (!keys.isAutomatic || (keys.openSubtitlesKey === '' && keys.subdlKey === '')) {
        return { kind: 'off' };
      }

      const row = await read(mediaId);

      if (row === null) {
        return { kind: 'absent' };
      }

      const minimum = row.seriesTitle === null ? keys.filmMinimumScore : keys.episodeMinimumScore;
      const video = await videoOf(row);
      const owned = new Set(own.map((language) => readLanguage(language) ?? language));
      const fetched = await store.list(mediaId);
      let added = 0;
      let upgraded = 0;

      for (const language of keys.languages.filter((one) => !owned.has(one))) {
        const current = fetched.find((entry) => entry.language === language);
        const currentScore =
          current === undefined
            ? null
            : current.score === 100 || (current.release === '' && current.scale === 'bazarr')
              ? current.score
              : current.release === ''
                ? bazarrMinimumOf(current.score, row.seriesTitle === null ? 'film' : 'episode')
                : scoreSubtitle(video, {
                    release: current.release,
                    frameRate: null,
                    isExactMatch: false,
                  }).score;
        const found = await finder.search(mediaId, language);
        const best = found?.subtitles.find(
          (subtitle) =>
            !subtitle.reasons.includes('differentFrameRate') &&
            !subtitle.isMachineTranslated &&
            subtitle.score >= minimum &&
            (currentScore === null || subtitle.score > currentScore),
        );

        if (best !== undefined) {
          const kept = await finder.fetch(mediaId, {
            source: best.source,
            id: best.id,
            language,
          });

          if (kept.kind === 'fetched') {
            added += current === undefined ? 1 : 0;
            upgraded += current === undefined ? 0 : 1;
          }
        }
      }

      await store.markChecked(mediaId);

      return { kind: 'looked', added, upgraded };
    },
  };

  return finder;
};

export { createSubtitleFinder };
