import { eq } from 'drizzle-orm';
import { library, mediaItem, series } from '#dialect/Schema';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { readLanguage } from '@ValenceCore/functions/describeTrack';
import { fetchOpenSubtitle } from './fetchOpenSubtitle';
import { fetchSubdlSubtitle } from './fetchSubdlSubtitle';
import { openSubtitlesHash } from './openSubtitlesHash';
import { searchOpenSubtitles } from './searchOpenSubtitles';
import { rankSubtitles } from './rankSubtitles';
import { searchSubdl } from './searchSubdl';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
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
};

/**
 * What the settings say of finding subtitles, without the keys and password themselves.
 *
 * @param saved - The settings.
 * @returns What an administrator is shown.
 */
const setupOf = (saved: SubtitleSettings): SubtitleSetup => ({
  hasOpenSubtitlesKey: saved.openSubtitlesKey !== '',
  openSubtitlesUsername: saved.openSubtitlesUsername,
  hasOpenSubtitlesPassword: saved.openSubtitlesPassword !== '',
  hasSubdlKey: saved.subdlKey !== '',
  languages: saved.languages,
  isAutomatic: saved.isAutomatic,
  filmMinimumScore: saved.filmMinimumScore,
  episodeMinimumScore: saved.episodeMinimumScore,
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
 * for. One it fetched before is swapped for a better one when a better one turns up.
 *
 * Each site needs its own key, entered by an administrator, since downloads are allowed per key and
 * per account. A site with no key is not asked.
 *
 * @param options - The database, the settings the keys are kept in, and the way out to the web.
 * @returns The finder.
 */
const createSubtitleFinder = ({
  db,
  settings,
  store,
  fetchImpl = fetch,
}: SubtitleFinderOptions): SubtitleFinder => {
  const saved = async () => (await settings.read()).subtitles;
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
    setup: async () => setupOf(await saved()),

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
        filmMinimumScore: change.filmMinimumScore ?? 60,
        episodeMinimumScore: change.episodeMinimumScore ?? 50,
      };

      return setupOf((await settings.write({ subtitles: next })).subtitles);
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
      const [opened, subdl] = await Promise.all([
        keys.openSubtitlesKey === ''
          ? []
          : searchOpenSubtitles(keys.openSubtitlesKey, lookup, fetchImpl),
        keys.subdlKey === '' ? [] : searchSubdl(keys.subdlKey, lookup, fetchImpl),
      ]);

      const ranked = rankSubtitles(row, [...opened, ...subdl]);

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
      const owned = new Set(own.map((language) => readLanguage(language) ?? language));
      const fetched = await store.list(mediaId);
      let added = 0;
      let upgraded = 0;

      for (const language of keys.languages.filter((one) => !owned.has(one))) {
        const current = fetched.find((entry) => entry.language === language);
        const found = await finder.search(mediaId, language);
        const best = found?.subtitles.find(
          (subtitle) =>
            !subtitle.reasons.includes('differentFrameRate') &&
            !subtitle.isMachineTranslated &&
            subtitle.score >= minimum &&
            (current === undefined || subtitle.score > current.score),
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
