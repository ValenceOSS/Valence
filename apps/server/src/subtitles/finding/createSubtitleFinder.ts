import { writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { eq } from 'drizzle-orm';
import { library, mediaItem, series } from '#dialect/Schema';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { fetchOpenSubtitle } from './fetchOpenSubtitle';
import { fetchSubdlSubtitle } from './fetchSubdlSubtitle';
import { openSubtitlesHash } from './openSubtitlesHash';
import { searchOpenSubtitles } from './searchOpenSubtitles';
import { searchSubdl } from './searchSubdl';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { SubtitleSettings } from '@ValenceContracts/schemas/SubtitleSettings';
import type { SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleFinder } from './SubtitleFinder';
import type { SubtitleLookup } from './SubtitleLookup';

const MOST_COPIES = 20;

type SubtitleFinderOptions = {
  db: AnyValenceDatabase;
  settings: SettingsStore;
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
});

/**
 * Finds subtitles for a film or episode on OpenSubtitles and SubDL and keeps the one chosen beside
 * the video, as `Name.en.srt` (or `.ass` or `.vtt`, as the site gave it), where every client already finds subtitles kept beside a video — so
 * a subtitle fetched is there the next time the film is played, with nothing to scan. Nothing
 * beside the video is ever written over: a second subtitle in a language is kept as `Name.en.2.srt`.
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
  fetchImpl = fetch,
}: SubtitleFinderOptions): SubtitleFinder => {
  const saved = async () => (await settings.read()).subtitles;

  const read = async (mediaId: string) => {
    const [row] = await db
      .select({
        path: mediaItem.path,
        externalId: mediaItem.externalId,
        imdbId: mediaItem.imdbId,
        seriesTitle: mediaItem.seriesTitle,
        season: mediaItem.seasonNumber,
        episode: mediaItem.episodeNumber,
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

  return {
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

      return { subtitles: [...opened, ...subdl], isSetUp };
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

      const stem = basename(row.path, extname(row.path));
      const language = choice.language.toLowerCase();

      for (let copy = 1; copy <= MOST_COPIES; copy += 1) {
        const name = `${stem}.${language}${copy === 1 ? '' : `.${copy.toString()}`}.${downloaded.extension}`;

        try {
          await writeFile(join(dirname(row.path), name), downloaded.bytes, { flag: 'wx' });

          return { kind: 'fetched', name };
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
            continue;
          }

          const refusal = diskRefusalOf(error instanceof Error ? error : null);

          return refusal.kind === 'missing' ? { kind: 'absent' } : refusal;
        }
      }

      return { kind: 'failed' };
    },
  };
};

export { createSubtitleFinder };
