import { isVideoLibrary } from '@ValenceServer/jellyfin/isVideoLibrary';
import { jellyfinItemOfMedia } from '@ValenceServer/jellyfin/jellyfinItemOfMedia';
import { jellyfinItemOfSeason } from '@ValenceServer/jellyfin/jellyfinItemOfSeason';
import { jellyfinItemOfShow } from '@ValenceServer/jellyfin/jellyfinItemOfShow';
import { jellyfinViewOf } from '@ValenceServer/jellyfin/jellyfinViewOf';
import { showIdOfEpisode } from '@ValenceServer/jellyfin/showIdOfEpisode';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';
import type { JellyfinItem, JellyfinQueryResult } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinBackend, JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinIds } from '@ValenceServer/jellyfin/createJellyfinIds';
import type { JellyfinViewing } from '@ValenceServer/jellyfin/JellyfinViewing';
import type { ItemsQuery } from '@ValenceServer/jellyfin/JellyfinRequests';

const EVERYTHING = 100_000;

const LATEST = 16;

type Kinds = { movies: boolean; series: boolean; seasons: boolean; episodes: boolean };

type Sorting = { by: string; isDescending: boolean };

/**
 * Which kinds of item a query asks for, where it names any.
 *
 * @param query - The query.
 * @returns Each kind, and whether it is wanted.
 */
const kindsOf = (
  query: Pick<ItemsQuery, 'includeitemtypes' | 'excludeitemtypes'>,
): Kinds | null => {
  const named = query.includeitemtypes.map((one) => one.toLowerCase());
  const left = new Set(query.excludeitemtypes.map((one) => one.toLowerCase()));

  if (named.length === 0) {
    return null;
  }

  const wants = (kind: string) => named.includes(kind) && !left.has(kind);

  return {
    movies: wants('movie') || wants('video'),
    series: wants('series'),
    seasons: wants('season'),
    episodes: wants('episode'),
  };
};

/**
 * How a query asks for its items to be ordered: by the first thing it names, and the way it names.
 *
 * @param query - The query.
 * @returns The ordering.
 */
const sortingOf = (query: Pick<ItemsQuery, 'sortby' | 'sortorder'>): Sorting => ({
  by: (query.sortby[0] ?? 'sortname').toLowerCase(),
  isDescending: (query.sortorder[0] ?? 'ascending').toLowerCase() === 'descending',
});

/**
 * Orders items as Jellyfin's apps ask for them.
 *
 * @param items - The items.
 * @param sorting - How they asked.
 * @returns The items in that order.
 */
const sorted = (items: readonly JellyfinItem[], sorting: Sorting): JellyfinItem[] => {
  const keyOf = (item: JellyfinItem): string | number => {
    switch (sorting.by) {
      case 'datecreated':
        return item.DateCreated ?? '';
      case 'premieredate':
      case 'productionyear':
        return item.PremiereDate ?? item.ProductionYear?.toString() ?? '';
      case 'communityrating':
        return item.CommunityRating ?? 0;
      case 'dateplayed':
        return item.UserData?.LastPlayedDate ?? '';
      case 'runtime':
        return item.RunTimeTicks ?? 0;
      case 'indexnumber':
      case 'parentindexnumber':
        return (item.ParentIndexNumber ?? 0) * 100_000 + (item.IndexNumber ?? 0);
      default:
        return (item.SortName ?? item.Name).toLowerCase();
    }
  };

  if (sorting.by === 'random') {
    return [...items].sort(() => Math.random() - 0.5);
  }

  const order = sorting.isDescending ? -1 : 1;

  return [...items].sort((one, other) => {
    const [a, b] = [keyOf(one), keyOf(other)];

    return a < b ? -order : a > b ? order : 0;
  });
};

/**
 * Whether an item meets the filters a query asks for: favourites, things somebody is part way
 * through, and things they have or have not watched.
 *
 * @param query - The query.
 * @returns Whether to keep an item.
 */
const filterOf =
  (query: Pick<ItemsQuery, 'filters' | 'isfavorite' | 'isplayed'>) =>
  (item: JellyfinItem): boolean => {
    const filters = new Set(query.filters.map((one) => one.toLowerCase()));
    const data = item.UserData;
    const isFavourite = query.isfavorite ?? (filters.has('isfavorite') ? true : undefined);
    const isPlayed =
      query.isplayed ??
      (filters.has('isplayed') ? true : filters.has('isunplayed') ? false : undefined);

    if (isFavourite !== undefined && (data?.IsFavorite ?? false) !== isFavourite) {
      return false;
    }

    if (isPlayed !== undefined && (data?.Played ?? false) !== isPlayed) {
      return false;
    }

    return !filters.has('isresumable') || (data?.PlaybackPositionTicks ?? 0) > 0;
  };

/**
 * Whether a summary is something Jellyfin's apps list on its own, rather than an extra or another
 * copy of something listed already.
 *
 * @param media - The summary.
 * @returns Whether to list it.
 */
const standsAlone = (media: MediaSummary): boolean =>
  (media.extraKind ?? null) === null && (media.parentId ?? null) === null;

/**
 * Answers Jellyfin's browsing endpoints from Valence's libraries: the views, the items in them,
 * the programmes, seasons and episodes, what is new, what somebody is part way through, and what
 * they would watch next.
 *
 * @param backend - What Valence answers with.
 * @param ids - How identifiers are worked out and read back.
 * @returns How each browsing question is answered.
 */
const createJellyfinBrowsing = (backend: JellyfinBackend, ids: JellyfinIds) => {
  const viewingOf = async (caller: JellyfinCaller): Promise<JellyfinViewing> => {
    const [serverId, progress, favourites] = await Promise.all([
      backend.serverId(),
      backend.progress(caller),
      backend.favourites(caller),
    ]);

    return {
      serverId,
      progress: new Map(progress.map((one) => [one.mediaId, one])),
      favourites: new Set(favourites),
    };
  };

  const videoLibraries = async (caller: JellyfinCaller) =>
    (await backend.libraries(caller)).filter(isVideoLibrary);

  const mediaIn = async (
    caller: JellyfinCaller,
    libraryIds: readonly string[],
    options: { search?: string; ids?: string[]; kind?: 'films' | 'shows' } = {},
  ): Promise<MediaSummary[]> =>
    libraryIds.length === 0
      ? []
      : (
          await backend.listItems(caller, libraryIds, {
            limit: EVERYTHING,
            offset: 0,
            order: 'newest',
            ...options,
          })
        ).items.filter(standsAlone);

  const showsIn = async (
    caller: JellyfinCaller,
    libraryIds: readonly string[],
  ): Promise<ShowSummary[]> => {
    const shows = (
      await Promise.all(libraryIds.map((libraryId) => backend.listShows(caller, libraryId)))
    ).flat();

    for (const show of shows) {
      ids.remember(show.libraryId, show.id);
    }

    return shows;
  };

  const ofMedia = (viewing: JellyfinViewing) => (media: MediaSummary) => {
    const showId = showIdOfEpisode(media);

    if (showId !== null) {
      ids.remember(media.libraryId, showId);
    }

    return jellyfinItemOfMedia(media, viewing);
  };

  const showOf = async (
    caller: JellyfinCaller,
    libraryId: string,
    showId: string,
  ): Promise<ShowDetail | null> => {
    ids.remember(libraryId, showId);

    return backend.getShow(caller, libraryId, showId);
  };

  const seasonsOf = (show: ShowDetail, viewing: JellyfinViewing): JellyfinItem[] =>
    show.seasons.map((season) => jellyfinItemOfSeason(show, season, viewing));

  const episodesOf = (
    show: ShowDetail,
    viewing: JellyfinViewing,
    seasonNumber?: number | null,
  ): JellyfinItem[] =>
    show.seasons
      .filter((season) => seasonNumber === undefined || season.seasonNumber === seasonNumber)
      .flatMap((season) => season.episodes)
      .map(ofMedia(viewing));

  const everythingFor = async (
    caller: JellyfinCaller,
    query: ItemsQuery,
    viewing: JellyfinViewing,
  ): Promise<JellyfinItem[]> => {
    const kinds = kindsOf(query);
    const search = query.searchterm?.trim() === '' ? undefined : query.searchterm?.trim();

    if (query.ids.length > 0) {
      const found = await Promise.all(query.ids.map((id) => itemFor(caller, id, viewing)));

      return found.filter((item) => item !== null);
    }

    const parentId = query.parentid ?? query.seasonid ?? query.seriesid;
    const parent = parentId === undefined ? null : await ids.read(caller, parentId);

    if (parentId !== undefined && parent === null) {
      return [];
    }

    if (parent?.kind === 'season' || parent?.kind === 'show') {
      const show = await showOf(caller, parent.libraryId, parent.showId);

      if (show === null) {
        return [];
      }

      if (parent.kind === 'season') {
        return episodesOf(show, viewing, parent.seasonNumber);
      }

      return kinds?.episodes === true || (query.recursive === true && kinds?.seasons !== true)
        ? episodesOf(show, viewing, query.season)
        : seasonsOf(show, viewing);
    }

    if (parent !== null && parent.kind !== 'library') {
      return [];
    }

    const libraries = parent === null ? await videoLibraries(caller) : [parent.library];
    const films = libraries.filter((one) => one.kind === 'movies').map((one) => one.id);
    const programmes = libraries.filter((one) => one.kind !== 'movies').map((one) => one.id);
    const wanted: Kinds = kinds ?? {
      movies: true,
      series: true,
      seasons: false,
      episodes: false,
    };

    if (parent === null && kinds === null && search === undefined && query.recursive !== true) {
      return libraries.map((library) => jellyfinViewOf(library, viewing.serverId));
    }

    const matches = (title: string) =>
      search === undefined || title.toLowerCase().includes(search.toLowerCase());
    const [movies, series, episodes] = await Promise.all([
      wanted.movies
        ? mediaIn(caller, films, search === undefined ? {} : { search })
        : Promise.resolve([]),
      wanted.series ? showsIn(caller, programmes) : Promise.resolve([]),
      wanted.episodes
        ? mediaIn(caller, programmes, search === undefined ? {} : { search })
        : Promise.resolve([]),
    ]);

    return [
      ...movies.map(ofMedia(viewing)),
      ...series
        .filter((show) => matches(show.title))
        .map((show) => jellyfinItemOfShow(show, viewing)),
      ...episodes.filter((media) => showIdOfEpisode(media) !== null).map(ofMedia(viewing)),
    ];
  };

  const itemFor = async (
    caller: JellyfinCaller,
    id: string,
    viewing: JellyfinViewing,
  ): Promise<JellyfinItem | null> => {
    const target = await ids.read(caller, id);

    if (target === null || target.kind === 'person') {
      return null;
    }

    if (target.kind === 'library') {
      return jellyfinViewOf(target.library, viewing.serverId);
    }

    if (target.kind === 'media') {
      const [summary] = await mediaIn(
        caller,
        (await videoLibraries(caller)).map((one) => one.id),
        { ids: [target.mediaId] },
      );
      const detail = await backend.getMedia(caller, target.mediaId);

      return summary === undefined ? null : jellyfinItemOfMedia(summary, viewing, detail);
    }

    const show = await showOf(caller, target.libraryId, target.showId);

    if (show === null) {
      return null;
    }

    if (target.kind === 'show') {
      return jellyfinItemOfShow(show, viewing, show);
    }

    const season = show.seasons.find((one) => one.seasonNumber === target.seasonNumber);

    return season === undefined ? null : jellyfinItemOfSeason(show, season, viewing);
  };

  const paged = (items: readonly JellyfinItem[], query: ItemsQuery): JellyfinQueryResult => {
    const start = query.startindex ?? 0;
    const kept = sorted(items.filter(filterOf(query)), sortingOf(query));

    return {
      Items: kept.slice(start, query.limit === undefined ? undefined : start + query.limit),
      TotalRecordCount: kept.length,
      StartIndex: start,
    };
  };

  return {
    viewingOf,

    views: async (caller: JellyfinCaller): Promise<JellyfinQueryResult> => {
      const serverId = await backend.serverId();
      const views = (await videoLibraries(caller)).map((library) =>
        jellyfinViewOf(library, serverId),
      );

      return { Items: views, TotalRecordCount: views.length, StartIndex: 0 };
    },

    items: async (caller: JellyfinCaller, query: ItemsQuery): Promise<JellyfinQueryResult> => {
      const viewing = await viewingOf(caller);

      return paged(await everythingFor(caller, query, viewing), query);
    },

    item: async (caller: JellyfinCaller, id: string): Promise<JellyfinItem | null> =>
      itemFor(caller, id, await viewingOf(caller)),

    latest: async (caller: JellyfinCaller, query: ItemsQuery): Promise<JellyfinItem[]> => {
      const viewing = await viewingOf(caller);
      const parent = query.parentid === undefined ? null : await ids.read(caller, query.parentid);
      const libraries =
        parent?.kind === 'library' ? [parent.library] : await videoLibraries(caller);
      const kinds = kindsOf(query);
      const films = libraries.filter((one) => one.kind === 'movies').map((one) => one.id);
      const programmes = libraries.filter((one) => one.kind !== 'movies').map((one) => one.id);
      const [movies, series] = await Promise.all([
        kinds === null || kinds.movies ? mediaIn(caller, films) : Promise.resolve([]),
        kinds === null || kinds.series || kinds.episodes
          ? showsIn(caller, programmes)
          : Promise.resolve([]),
      ]);
      const items = [
        ...movies.map(ofMedia(viewing)),
        ...series.map((show) => jellyfinItemOfShow(show, viewing)),
      ].filter((item) => item.UserData?.Played !== true);

      return sorted(items, { by: 'datecreated', isDescending: true }).slice(
        0,
        query.limit ?? LATEST,
      );
    },

    resume: async (caller: JellyfinCaller, query: ItemsQuery): Promise<JellyfinQueryResult> => {
      const viewing = await viewingOf(caller);
      const started = [...viewing.progress.values()]
        .filter((one) => !one.isFinished && one.isDismissed !== true && one.positionSeconds > 0)
        .sort((one, other) => other.updatedAt.localeCompare(one.updatedAt));
      const libraries = (await videoLibraries(caller)).map((one) => one.id);
      const found = await mediaIn(caller, libraries, { ids: started.map((one) => one.mediaId) });
      const byId = new Map(found.map((media) => [media.id, media]));
      const kinds = kindsOf(query);
      const items = started
        .map((one) => byId.get(one.mediaId))
        .filter((media) => media !== undefined)
        .filter((media) => {
          const isEpisode = showIdOfEpisode(media) !== null;

          return kinds === null || (isEpisode ? kinds.episodes : kinds.movies);
        })
        .map(ofMedia(viewing));
      const start = query.startindex ?? 0;

      return {
        Items: items.slice(start, query.limit === undefined ? undefined : start + query.limit),
        TotalRecordCount: items.length,
        StartIndex: start,
      };
    },

    nextUp: async (caller: JellyfinCaller, query: ItemsQuery): Promise<JellyfinQueryResult> => {
      const viewing = await viewingOf(caller);
      const items = (await backend.upNext(caller)).map(ofMedia(viewing));
      const series = query.seriesid?.replaceAll('-', '').toLowerCase();
      const kept = series === undefined ? items : items.filter((item) => item.SeriesId === series);
      const start = query.startindex ?? 0;

      return {
        Items: kept.slice(start, query.limit === undefined ? undefined : start + query.limit),
        TotalRecordCount: kept.length,
        StartIndex: start,
      };
    },

    seasons: async (
      caller: JellyfinCaller,
      showId: string,
    ): Promise<JellyfinQueryResult | null> => {
      const target = await ids.read(caller, showId);

      if (target?.kind !== 'show') {
        return null;
      }

      const show = await showOf(caller, target.libraryId, target.showId);
      const items = show === null ? [] : seasonsOf(show, await viewingOf(caller));

      return { Items: items, TotalRecordCount: items.length, StartIndex: 0 };
    },

    episodes: async (
      caller: JellyfinCaller,
      showId: string,
      query: ItemsQuery,
    ): Promise<JellyfinQueryResult | null> => {
      const target = await ids.read(caller, showId);

      if (target?.kind !== 'show') {
        return null;
      }

      const show = await showOf(caller, target.libraryId, target.showId);
      const season = query.seasonid === undefined ? null : await ids.read(caller, query.seasonid);
      const seasonNumber = season?.kind === 'season' ? season.seasonNumber : query.season;
      const items = show === null ? [] : episodesOf(show, await viewingOf(caller), seasonNumber);
      const start = query.startindex ?? 0;

      return {
        Items: items.slice(start, query.limit === undefined ? undefined : start + query.limit),
        TotalRecordCount: items.length,
        StartIndex: start,
      };
    },
  };
};

type JellyfinBrowsing = ReturnType<typeof createJellyfinBrowsing>;

export type { JellyfinBrowsing };

export { createJellyfinBrowsing };
