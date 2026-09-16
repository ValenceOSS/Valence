import { randomUUID } from 'node:crypto';
import { groupIntoShows, buildShowDetail } from './groupIntoShows';
import type { Library, MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { LibraryService, ListItemsOptions } from './LibraryService';
import type { Person } from '@ValenceContracts/schemas/Person';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Cuts everything held about an item down to what a browser needs to draw it. Written once and used
 * by both the listing and the grouping into shows, so a programme cannot come to different
 * conclusions about an episode than a rail does.
 *
 * @param item - Everything known about the item.
 * @returns The summary a page is sent.
 */
const toSummary = (item: MediaDetail): MediaSummary => ({
  id: item.id,
  libraryId: item.libraryId,
  title: item.title,
  year: item.year ?? null,
  durationSeconds: item.durationSeconds,
  width: item.width,
  height: item.height,
  videoCodec: item.videoCodec,
  videoRange: item.videoRange,
  addedAt: item.addedAt,
  hasPoster: item.metadata.hasPoster,
  hasBackdrop: item.metadata.hasBackdrop,
  hasLogo: false,
  seriesId: null,
  parentId: item.parentId ?? null,
  extraKind: item.extraKind ?? null,
  versionLabel: item.versionLabel ?? null,
  rating: item.metadata.rating ?? null,
  seriesTitle: item.metadata.seriesTitle ?? null,
  seasonNumber: item.metadata.seasonNumber ?? null,
  episodeNumber: item.metadata.episodeNumber ?? null,
  genres: item.metadata.genres ?? null,
});

type HiddenRow = {
  profileId: string;
  mediaItemId?: string;
  seriesId?: string;
  libraryId?: string;
};

type MemoryState = {
  libraries: Library[];
  media: MediaDetail[];
  series?: { id: string; title: string }[];
  starsFor?: (mediaId: string) => number | null;
  people?: Record<number, Person>;
  hidden?: HiddenRow[];
  blocked?: { accountId: string; libraryId: string }[];
  ceilings?: {
    accountId: string;
    libraryId: string;
    maximumAge: number;
    allowsUnrated: boolean;
  }[];
  exceptions?: {
    accountId: string;
    mediaItemId?: string;
    seriesId?: string;
    effect: 'allow' | 'deny';
  }[];
  ageOf?: (mediaId: string) => number | null;
};

/**
 * Whether an item sits within the age an account is allowed, in the order the database version asks
 * it: a deny beats everything, an allow beats the ceiling, and otherwise the ceiling for the library
 * it is in decides — with something nobody certificated refused unless unrated things are allowed.
 *
 * Kept in step with that version for the reason the search is: a twin that decided this differently
 * would let every test of the HTTP surface pass while describing a server that shows a child things
 * it should not.
 *
 * @param state - What this service is holding.
 * @param accountId - Whose ceiling to apply.
 * @param item - The item, its programme and its library.
 * @returns Whether it is within the ceiling.
 */
const withinCeiling = (
  state: MemoryState,
  accountId: string,
  item: { id: string; seriesId: string | null; libraryId: string },
): boolean => {
  const named = (effect: 'allow' | 'deny') =>
    (state.exceptions ?? []).some(
      (one) =>
        one.accountId === accountId &&
        one.effect === effect &&
        ((one.mediaItemId !== undefined && one.mediaItemId === item.id) ||
          (one.seriesId !== undefined && item.seriesId !== null && one.seriesId === item.seriesId)),
    );

  if (named('deny')) {
    return false;
  }

  if (named('allow')) {
    return true;
  }

  const ceiling = (state.ceilings ?? []).find(
    (one) => one.accountId === accountId && one.libraryId === item.libraryId,
  );

  if (ceiling === undefined) {
    return true;
  }

  const age = state.ageOf?.(item.id) ?? null;

  return age === null ? ceiling.allowsUnrated : age <= ceiling.maximumAge;
};

/**
 * Whether this viewer's account was refused the library something sits in.
 *
 * Kept in step with the condition the database version builds, for the reason the search above is:
 * a memory service that decided visibility differently would let every test of the HTTP surface pass
 * while describing a server that does not exist.
 *
 * @param state - What this service is holding.
 * @param viewer - Who is asking.
 * @param libraryId - The library the thing is in.
 * @returns Whether the account may reach it.
 */
const reaches = (state: MemoryState, viewer: Viewer, libraryId: string): boolean => {
  if (viewer.kind !== 'account' || viewer.isAdministrator) {
    return true;
  }

  return !blocks(state, viewer.accountId, libraryId);
};

/**
 * Whether an account may reach one particular item: the library it is in, and the age it carries.
 *
 * @param state - What this service is holding.
 * @param viewer - Who is asking.
 * @param item - The item, its programme and its library.
 * @returns Whether to let them have it.
 */
const reachesItem = (
  state: MemoryState,
  viewer: Viewer,
  item: { id: string; seriesId: string | null; libraryId: string },
): boolean => {
  if (viewer.kind !== 'account' || viewer.isAdministrator) {
    return true;
  }

  return (
    !blocks(state, viewer.accountId, item.libraryId) && withinCeiling(state, viewer.accountId, item)
  );
};

/**
 * Whether an account was refused a library outright, before any question of who is an administrator.
 *
 * @param state - What this service is holding.
 * @param accountId - Whose account.
 * @param libraryId - The library.
 * @returns Whether a refusal was recorded.
 */
const blocks = (state: MemoryState, accountId: string, libraryId: string): boolean =>
  (state.blocked ?? []).some((row) => row.accountId === accountId && row.libraryId === libraryId);

/**
 * Whether the person watching has hidden something, by itself, by its programme, or by its library.
 *
 * @param state - What this service is holding.
 * @param viewer - Who is asking.
 * @param what - The item's own identifier, its programme's, and its library's.
 * @returns Whether they hid it.
 */
const hides = (
  state: MemoryState,
  viewer: Viewer,
  what: { id: string; seriesId: string | null; libraryId: string },
): boolean => {
  if (viewer.kind !== 'account' || viewer.profileId === null) {
    return false;
  }

  const { profileId } = viewer;

  return (state.hidden ?? []).some(
    (row) =>
      row.profileId === profileId &&
      ((row.mediaItemId !== undefined && row.mediaItemId === what.id) ||
        (row.seriesId !== undefined && what.seriesId !== null && row.seriesId === what.seriesId) ||
        (row.libraryId !== undefined && row.libraryId === what.libraryId)),
  );
};

/**
 * Whether an item should be shown to a viewer at all: reachable by their account, and not hidden by
 * them.
 *
 * @param state - What this service is holding.
 * @param viewer - Who is asking.
 * @param item - The item.
 * @returns Whether to show it.
 */
const visible = (state: MemoryState, viewer: Viewer, item: MediaDetail): boolean =>
  reachesItem(state, viewer, {
    id: item.id,
    seriesId: seriesIdOf(state, item),
    libraryId: item.libraryId,
  }) &&
  !hides(state, viewer, {
    id: item.id,
    seriesId: seriesIdOf(state, item),
    libraryId: item.libraryId,
  });

/**
 * Which programme an item belongs to, matched by title the way the memory state records it.
 *
 * @param state - What this service is holding.
 * @param item - The item.
 * @returns The programme's identifier, or nothing where it is a film.
 */
const seriesIdOf = (state: MemoryState, item: MediaDetail): string | null => {
  const title = item.metadata.seriesTitle ?? null;

  if (title === null) {
    return null;
  }

  return (state.series ?? []).find((entry) => entry.title === title)?.id ?? null;
};

/**
 * Matches a typed search against an item, in step with what the database version searches: title,
 * series title, description, tagline and cast. A memory service that searched differently would let
 * every test of the HTTP surface pass while describing behaviour the real server does not have.
 *
 * @param item - The item being tested.
 * @param search - What was typed, lowered.
 * @returns Whether the item matches.
 */
const matchesSearch = (item: MediaDetail, search: string): boolean =>
  [
    item.title,
    item.metadata.seriesTitle ?? '',
    item.metadata.overview ?? '',
    item.metadata.tagline ?? '',
    ...(item.metadata.cast ?? []).map((member) => member.name),
  ].some((against) => against.toLowerCase().includes(search));

/**
 * Decides whether an item survives the narrowing filters, in step with the database version for the
 * same reason the search is. An item with no year or no rating fails a filter asking about one
 * rather than passing it: asking for at least seven is not asking to also be shown everything
 * nobody has scored.
 *
 * @param item - The item being tested.
 * @param options - The filters asked for.
 * @returns Whether the item survives them all.
 */
const matchesFilters = (item: MediaDetail, options: ListItemsOptions): boolean => {
  const year = item.year ?? null;
  const rating = item.metadata.rating ?? null;

  return (
    (options.yearFrom === undefined || (year !== null && year >= options.yearFrom)) &&
    (options.yearTo === undefined || (year !== null && year <= options.yearTo)) &&
    (options.minRating === undefined || (rating !== null && rating >= options.minRating))
  );
};

/**
 * A library held in memory, so the HTTP surface can be exercised without Postgres. Models the
 * behaviour the routes depend on — searching, filtering, paging, missing identifiers — in step with
 * the database version, since a test passing against different behaviour describes a server that
 * does not exist.
 *
 * @param state - Any libraries and items to start with.
 * @returns The library service, and the state behind it.
 */
const createMemoryLibraryService = (
  state: MemoryState = { libraries: [], media: [] },
): LibraryService & { state: MemoryState } => ({
  state,

  list: (viewer) =>
    Promise.resolve(
      state.libraries
        .filter((entry) => reaches(state, viewer, entry.id))
        .filter(
          (entry) =>
            viewer.kind !== 'account' ||
            viewer.profileId === null ||
            !(state.hidden ?? []).some(
              (row) => row.profileId === viewer.profileId && row.libraryId === entry.id,
            ),
        )
        .map((entry) => ({
          ...entry,
          itemCount: state.media.filter((item) => item.libraryId === entry.id).length,
        })),
    ),

  create: (input) => {
    const created: Library = {
      id: randomUUID(),
      name: input.name,
      kind: input.kind,
      path: input.path,
      itemCount: 0,
      lastScannedAt: null,
      defaultAudioLanguage: null,
      filesAtOnce: null,
    };

    state.libraries.push(created);

    return Promise.resolve(created);
  },

  update: (libraryId, input) => {
    const found = state.libraries.find((entry) => entry.id === libraryId);

    if (found === undefined) {
      return Promise.resolve(null);
    }

    found.defaultAudioLanguage = input.defaultAudioLanguage;

    if (input.filesAtOnce !== undefined) {
      found.filesAtOnce = input.filesAtOnce;
    }

    return Promise.resolve(found);
  },

  listFacets: (viewer) => {
    const seen = state.media.filter((item) => visible(state, viewer, item));

    return Promise.resolve({
      genres: [...new Set(seen.flatMap((item) => item.metadata.genres ?? []))].sort((one, other) =>
        one.localeCompare(other),
      ),
      decades: [
        ...new Set(
          seen
            .map((item) => item.year ?? null)
            .filter((year) => year !== null)
            .map((year) => Math.floor(year / 10) * 10),
        ),
      ].sort((one, other) => other - one),
      maxRating: seen.reduce((best, item) => Math.max(best, item.metadata.rating ?? 0), 0),
    });
  },

  refusedLibraries: (accountId) =>
    Promise.resolve(
      (state.blocked ?? [])
        .filter((row) => row.accountId === accountId)
        .map((row) => row.libraryId),
    ),

  allowLibrary: (accountId, libraryId) => {
    state.blocked = (state.blocked ?? []).filter(
      (row) => !(row.accountId === accountId && row.libraryId === libraryId),
    );

    return Promise.resolve();
  },

  refuseLibrary: (accountId, libraryId) => {
    const held = state.blocked ?? [];

    if (!held.some((row) => row.accountId === accountId && row.libraryId === libraryId)) {
      state.blocked = [...held, { accountId, libraryId }];
    }

    return Promise.resolve();
  },

  ceilingsFor: (accountId) =>
    Promise.resolve(
      (state.ceilings ?? [])
        .filter((one) => one.accountId === accountId)
        .map(({ libraryId, maximumAge, allowsUnrated }) => ({
          libraryId,
          maximumAge,
          allowsUnrated,
        })),
    ),

  setCeiling: (accountId, ceiling) => {
    state.ceilings = [
      ...(state.ceilings ?? []).filter(
        (one) => !(one.accountId === accountId && one.libraryId === ceiling.libraryId),
      ),
      { accountId, ...ceiling },
    ];

    return Promise.resolve();
  },

  clearCeiling: (accountId, libraryId) => {
    state.ceilings = (state.ceilings ?? []).filter(
      (one) => !(one.accountId === accountId && one.libraryId === libraryId),
    );

    return Promise.resolve();
  },

  exceptionsFor: (accountId) =>
    Promise.resolve(
      (state.exceptions ?? [])
        .filter((one) => one.accountId === accountId)
        .flatMap((one) => {
          const subjectId = one.mediaItemId ?? one.seriesId;

          if (subjectId === undefined) {
            return [];
          }

          return [
            {
              kind: one.mediaItemId === undefined ? ('series' as const) : ('item' as const),
              subjectId,
              title:
                state.media.find((item) => item.id === subjectId)?.title ??
                (state.series ?? []).find((entry) => entry.id === subjectId)?.title ??
                subjectId,
              effect: one.effect,
            },
          ];
        }),
    ),

  setException: (accountId, subject, effect) => {
    const exists =
      subject.kind === 'item'
        ? state.media.some((item) => item.id === subject.subjectId)
        : (state.series ?? []).some((entry) => entry.id === subject.subjectId);

    if (!exists) {
      return Promise.resolve(false);
    }

    state.exceptions = [
      ...(state.exceptions ?? []).filter(
        (one) =>
          !(
            one.accountId === accountId &&
            (subject.kind === 'item' ? one.mediaItemId : one.seriesId) === subject.subjectId
          ),
      ),
      {
        accountId,
        ...(subject.kind === 'item'
          ? { mediaItemId: subject.subjectId }
          : { seriesId: subject.subjectId }),
        effect,
      },
    ];

    return Promise.resolve(true);
  },

  clearException: (accountId, subject) => {
    const before = (state.exceptions ?? []).length;

    state.exceptions = (state.exceptions ?? []).filter(
      (one) =>
        !(
          one.accountId === accountId &&
          (subject.kind === 'item' ? one.mediaItemId : one.seriesId) === subject.subjectId
        ),
    );

    return Promise.resolve((state.exceptions ?? []).length < before);
  },

  isLibraryOutOfReach: (accountId, libraryId) =>
    Promise.resolve(blocks(state, accountId, libraryId)),

  isOutOfReach: (accountId, mediaId) => {
    const found = state.media.find((item) => item.id === mediaId);

    if (found === undefined) {
      return Promise.resolve(false);
    }

    const where = {
      id: found.id,
      seriesId: seriesIdOf(state, found),
      libraryId: found.libraryId,
    };

    return Promise.resolve(
      blocks(state, accountId, found.libraryId) || !withinCeiling(state, accountId, where),
    );
  },

  isSeriesOutOfReach: (accountId, seriesId) => {
    const episodes = state.media.filter((item) => seriesIdOf(state, item) === seriesId);

    return Promise.resolve(
      episodes.length > 0 &&
        episodes.every(
          (item) =>
            blocks(state, accountId, item.libraryId) ||
            !withinCeiling(state, accountId, {
              id: item.id,
              seriesId,
              libraryId: item.libraryId,
            }),
        ),
    );
  },

  listItems: (viewer, libraryId, options) => {
    const found = state.libraries.find((entry) => entry.id === libraryId);

    if (found === undefined || !reaches(state, viewer, found.id)) {
      return Promise.resolve(null);
    }

    const search = options.search?.toLowerCase() ?? '';

    const matching = state.media
      .filter((item) => item.libraryId === libraryId)
      .filter((item) => visible(state, viewer, item))
      .filter((item) => search === '' || matchesSearch(item, search))
      .filter(
        (item) =>
          options.kind === undefined ||
          (options.kind === 'shows'
            ? (item.metadata.seriesTitle ?? null) !== null
            : (item.metadata.seriesTitle ?? null) === null),
      )
      .filter(
        (item) =>
          options.genre === undefined || (item.metadata.genres ?? []).includes(options.genre),
      )
      .filter((item) => matchesFilters(item, options))
      .filter((item) =>
        options.ids === undefined
          ? (item.extraKind ?? null) === null
          : options.ids.includes(item.id),
      )
      .filter(
        (item) =>
          options.minYourStars === undefined ||
          (state.starsFor?.(item.id) ?? 0) >= options.minYourStars,
      )
      .sort((left, right) => {
        if (options.order === 'yourRating') {
          const given = (state.starsFor?.(right.id) ?? 0) - (state.starsFor?.(left.id) ?? 0);

          return given === 0 ? left.title.localeCompare(right.title) : given;
        }

        return options.order === 'newest'
          ? right.addedAt.localeCompare(left.addedAt)
          : left.title.localeCompare(right.title);
      });

    const items = matching.slice(options.offset, options.offset + options.limit).map(toSummary);

    return Promise.resolve({ items, total: matching.length });
  },

  getMedia: (id) => {
    const found = state.media.find((item) => item.id === id) ?? null;

    return Promise.resolve(
      found === null
        ? null
        : {
            ...found,
            extras: state.media
              .filter((item) => item.parentId === id && (item.extraKind ?? null) !== null)
              .map(toSummary),
            versions: state.media
              .filter((item) => item.parentId === id && (item.extraKind ?? null) === null)
              .map(toSummary),
          },
    );
  },

  getSeries: (seriesId) =>
    Promise.resolve((state.series ?? []).find((entry) => entry.id === seriesId) ?? null),

  seriesOf: (mediaId) => {
    const item = state.media.find((one) => one.id === mediaId);

    return Promise.resolve(item === undefined ? null : toSummary(item).seriesId);
  },

  itemsForShare: (scope) =>
    Promise.resolve(
      state.media
        .filter((item) =>
          scope.kind === 'item'
            ? scope.mediaId !== null && item.id === scope.mediaId
            : scope.seriesId !== null && toSummary(item).seriesId === scope.seriesId,
        )
        .map(toSummary),
    ),

  findByPerson: (viewer, personId) =>
    Promise.resolve(
      state.media
        .filter((item) => visible(state, viewer, item))
        .filter((item) => (item.metadata.cast ?? []).some((member) => member.personId === personId))
        .map(toSummary)
        .sort((left, right) => left.title.localeCompare(right.title)),
    ),

  readPerson: (personId) => Promise.resolve(state.people?.[personId] ?? null),

  listShows: (viewer, libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId) && reaches(state, viewer, libraryId)
        ? groupIntoShows(
            state.media
              .filter((item) => item.libraryId === libraryId)
              .filter((item) => visible(state, viewer, item))
              .map(toSummary),
          )
        : null,
    ),

  getShow: (viewer, libraryId, showId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId) && reaches(state, viewer, libraryId)
        ? buildShowDetail(
            state.media
              .filter((item) => item.libraryId === libraryId)
              .filter((item) => visible(state, viewer, item))
              .map(toSummary),
            showId,
          )
        : null,
    ),

  scan: (libraryId, force = false) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `job-${libraryId}${force ? '-force' : ''}`, state: 'queued' }
        : null,
    ),

  correctMatch: (mediaId) => {
    const item = state.media.find((one) => one.id === mediaId);

    if (item === undefined) {
      return Promise.resolve(null);
    }

    const family =
      item.metadata.seriesTitle === null || item.metadata.seriesTitle === undefined
        ? [item]
        : state.media.filter(
            (one) =>
              one.libraryId === item.libraryId &&
              one.metadata.seriesTitle === item.metadata.seriesTitle,
          );

    return Promise.resolve({ corrected: family.length, jobId: null });
  },

  forgetCorrection: (mediaId) =>
    Promise.resolve(
      state.media.some((one) => one.id === mediaId) ? { corrected: 1, jobId: null } : null,
    ),

  rebuildArtefacts: (mediaId) =>
    Promise.resolve(
      state.media.some((one) => one.id === mediaId) ? { preview: true, trickplay: true } : null,
    ),

  reset: (libraryId) => {
    if (!state.libraries.some((entry) => entry.id === libraryId)) {
      return Promise.resolve(null);
    }

    state.media = state.media.filter((item) => item.libraryId !== libraryId);

    return Promise.resolve({ jobId: `reset-${libraryId}`, state: 'queued' });
  },

  remove: (libraryId) => {
    if (!state.libraries.some((entry) => entry.id === libraryId)) {
      return Promise.resolve(false);
    }

    state.libraries = state.libraries.filter((entry) => entry.id !== libraryId);
    state.media = state.media.filter((item) => item.libraryId !== libraryId);

    return Promise.resolve(true);
  },

  regeneratePreviews: (libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `regenerate-previews-${libraryId}`, state: 'queued' }
        : null,
    ),

  remakePreviews: (libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `regenerate-previews-${libraryId}`, state: 'queued' }
        : null,
    ),

  fetchLogos: (libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `fetch-logos-${libraryId}`, state: 'queued' }
        : null,
    ),

  regenerateTrickplay: (libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `regenerate-trickplay-${libraryId}`, state: 'queued' }
        : null,
    ),

  detectSegments: (libraryId) =>
    Promise.resolve(
      state.libraries.some((entry) => entry.id === libraryId)
        ? { jobId: `detect-segments-${libraryId}`, state: 'queued' }
        : null,
    ),

  readScanState: () =>
    Promise.resolve({ state: 'completed', phase: null, processed: null, total: null }),

  readArtworkUrl: (mediaId, kind) =>
    Promise.resolve(
      state.media.some((item) => item.id === mediaId)
        ? `https://images.test/${kind}/${mediaId}.jpg`
        : null,
    ),
});

export type { MemoryState };

export { createMemoryLibraryService };
