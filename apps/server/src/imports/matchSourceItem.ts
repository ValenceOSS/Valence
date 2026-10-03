import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import type { PathMapping } from '@ValenceContracts/schemas/MediaImport';
import { mapSourcePath } from './mapSourcePath';
import { titleKey } from './titleKey';
import type { SourceItem } from './SourceReader';
import type { ValenceIndex } from './readValenceIndex';

type ItemMatch =
  | { kind: 'item'; mediaItemId: string; by: 'id' | 'path' | 'title' }
  | { kind: 'series'; seriesId: string; by: 'id' | 'title' }
  | { kind: 'unmatched'; reason: Said };

type MatchContext = {
  index: ValenceIndex;
  mappings: readonly PathMapping[];
  parents: ReadonlyMap<string, SourceItem>;
  tmdbOfTvdb: ReadonlyMap<string, string>;
};

/**
 * The one value of a lookup, where there is exactly one.
 *
 * @param found - What the lookup found.
 * @returns The value, or null where there was none or more than one.
 */
const onlyOne = (found: readonly string[] | undefined): string | null =>
  found?.length === 1 ? (found[0] ?? null) : null;

/**
 * Finds a film by its title and year, allowing the year to be one out, as two catalogues often
 * disagree by one about when a film came out.
 *
 * @param item - The film on the source.
 * @param index - What Valence holds.
 * @returns The match, or why there is none.
 */
const filmByTitle = (item: SourceItem, index: ValenceIndex): ItemMatch => {
  const key = titleKey(item.title);
  const years = item.year === null ? [''] : [item.year, item.year - 1, item.year + 1, ''];

  for (const year of years) {
    const found = index.filmsByTitle.get(`${key}|${year.toString()}`);

    if (found !== undefined && found.length > 1) {
      return {
        kind: 'unmatched',
        reason: saying('server.imports.matchSourceItem.moreThanOneMatches'),
      };
    }

    const one = onlyOne(found);

    if (one !== null) {
      return { kind: 'item', mediaItemId: one, by: 'title' };
    }
  }

  return { kind: 'unmatched', reason: saying('server.imports.matchSourceItem.nothingMatches') };
};

/**
 * Finds what a film, episode, programme or track on a Jellyfin, Emby or Plex server is in Valence:
 * by its catalogue identifiers first, then by where its file is, then by its title.
 *
 * @param item - The thing on the source.
 * @param context - What Valence holds, how paths move between the two, and the source's
 *   programmes and albums for an episode or track to be read beside.
 * @returns What it is in Valence, or why nothing is.
 */
const matchSourceItem = (item: SourceItem, context: MatchContext): ItemMatch => {
  const { index, mappings, parents, tmdbOfTvdb } = context;
  const byPath =
    item.path === null ? null : (index.byPath.get(mapSourcePath(item.path, mappings)) ?? null);
  const pathMatch: ItemMatch | null =
    byPath === null ? null : { kind: 'item', mediaItemId: byPath, by: 'path' };

  if (item.kind === 'movie') {
    const byTmdb = item.ids.tmdb === null ? undefined : index.filmsByTmdb.get(item.ids.tmdb)?.[0];
    const byImdb =
      item.ids.imdb === null ? undefined : index.filmsByImdb.get(item.ids.imdb.toLowerCase())?.[0];
    const byId = byTmdb ?? byImdb ?? null;

    if (byId !== null) {
      return { kind: 'item', mediaItemId: byId, by: 'id' };
    }

    return pathMatch ?? filmByTitle(item, index);
  }

  if (item.kind === 'series') {
    const tmdb =
      item.ids.tmdb ?? (item.ids.tvdb === null ? null : (tmdbOfTvdb.get(item.ids.tvdb) ?? null));
    const byId = tmdb === null ? null : (index.seriesByTmdb.get(tmdb) ?? null);

    if (byId !== null) {
      return { kind: 'series', seriesId: byId, by: 'id' };
    }

    const found = index.seriesByTitle.get(titleKey(item.title));
    const one = onlyOne(found);

    if (one !== null) {
      return { kind: 'series', seriesId: one, by: 'title' };
    }

    return {
      kind: 'unmatched',
      reason:
        found !== undefined && found.length > 1
          ? saying('server.imports.matchSourceItem.moreThanOneMatches')
          : saying('server.imports.matchSourceItem.nothingMatches'),
    };
  }

  if (item.kind === 'episode') {
    const show = item.seriesId === null ? undefined : parents.get(item.seriesId);
    const tmdb =
      show?.ids.tmdb ??
      (show?.ids.tvdb === null || show?.ids.tvdb === undefined
        ? null
        : (tmdbOfTvdb.get(show.ids.tvdb) ?? null));
    const position =
      item.seasonNumber === null || item.episodeNumber === null
        ? null
        : `${item.seasonNumber.toString()}|${item.episodeNumber.toString()}`;
    const byId =
      tmdb === null || position === null
        ? null
        : (index.episodesByTmdb.get(`${tmdb}|${position}`) ?? null);

    if (byId !== null) {
      return { kind: 'item', mediaItemId: byId, by: 'id' };
    }

    if (pathMatch !== null) {
      return pathMatch;
    }

    const byTitle =
      show === undefined || position === null
        ? null
        : onlyOne(index.episodesByTitle.get(`${titleKey(show.title)}|${position}`));

    return byTitle === null
      ? { kind: 'unmatched', reason: saying('server.imports.matchSourceItem.nothingMatches') }
      : { kind: 'item', mediaItemId: byTitle, by: 'title' };
  }

  if (item.kind === 'track') {
    const album = item.albumId === null ? undefined : parents.get(item.albumId);
    const position =
      item.trackNumber === null
        ? null
        : `${(item.discNumber ?? 1).toString()}|${item.trackNumber.toString()}`;
    const albumIds = [
      item.ids.musicBrainzAlbum,
      item.ids.musicBrainzReleaseGroup,
      album?.ids.musicBrainzAlbum ?? null,
      album?.ids.musicBrainzReleaseGroup ?? null,
    ].filter((id) => id !== null);
    const byId =
      position === null
        ? null
        : (albumIds
            .map((id) => index.tracksByAlbumId.get(`${id.toLowerCase()}|${position}`))
            .find((found) => found !== undefined) ?? null);

    if (byId !== null) {
      return { kind: 'item', mediaItemId: byId, by: 'id' };
    }

    if (pathMatch !== null) {
      return pathMatch;
    }

    const byTitle =
      album === undefined || position === null
        ? null
        : onlyOne(index.tracksByAlbumTitle.get(`${titleKey(album.title)}|${position}`));

    return byTitle === null
      ? { kind: 'unmatched', reason: saying('server.imports.matchSourceItem.nothingMatches') }
      : { kind: 'item', mediaItemId: byTitle, by: 'title' };
  }

  return {
    kind: 'unmatched',
    reason: saying('server.imports.matchSourceItem.valenceKeepsNothingLikeIt'),
  };
};

export type { ItemMatch, MatchContext };

export { matchSourceItem };
