import { nameKey } from '@ValenceServer/music/nameKey';
import type {
  CatalogueEntry,
  CatalogueTab,
  TitleStatus,
} from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequest, MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { HeldTitle } from '@ValenceServer/requests/titles/HeldTitle';

const TAB_OF: Readonly<Record<MediaRequestKind, CatalogueTab>> = {
  film: 'films',
  series: 'shows',
  artist: 'music',
  album: 'music',
  book: 'books',
};

const ON_ITS_WAY = new Set<MediaRequest['items'][number]['state']>([
  'chosen',
  'downloading',
  'filing',
]);

const HERE = new Set<MediaRequest['items'][number]['state']>(['filed', 'available']);

/**
 * What a title is matched on between the library and the requests: its catalogue id, or for a
 * book its author and title together, as the libraries read books by name.
 *
 * @param kind - What it is.
 * @param catalogueId - The id it is known by, where it has one.
 * @param title - Its title.
 * @param subtitle - Its author, for a book.
 * @returns The key, or nothing where it can be matched on nothing.
 */
const matchKeyOf = (
  kind: MediaRequestKind,
  catalogueId: string | null,
  title: string,
  subtitle: string | null,
): string | null =>
  kind === 'book'
    ? `book:${nameKey((subtitle ?? '').split(',')[0] ?? '')}/${nameKey(title)}`
    : catalogueId === null || catalogueId === ''
      ? null
      : `${kind}:${catalogueId}`;

/**
 * Where a request stands, for the Catalogue's status: waiting on approval, failed somewhere,
 * downloading, still missing something it follows, or in the library.
 *
 * @param request - The request.
 * @returns Its status, or nothing for a refused one.
 */
const statusOfRequest = (request: MediaRequest): TitleStatus | null => {
  if (request.approval === 'refused') {
    return null;
  }

  if (request.approval === 'awaiting') {
    return 'toApprove';
  }

  const { items } = request;

  if (items.some((item) => item.state === 'failed')) {
    return 'failed';
  }

  if (items.some((item) => ON_ITS_WAY.has(item.state))) {
    return 'downloading';
  }

  const isMissing = items.some(
    (item) => item.isFollowed && (item.state === 'wanted' || item.state === 'searching'),
  );
  const isNothingHere = items.length > 0 && !items.some((item) => HERE.has(item.state));

  return isMissing || isNothingHere ? 'missing' : 'library';
};

/**
 * The admin Catalogue: every title the libraries hold and every title asked for, one entry each,
 * with where it stands. A title held but never asked for is not followed. A refused request adds
 * nothing of its own, though what it was for may still be held. A title held in two libraries is
 * listed once.
 *
 * @param held - What the libraries hold.
 * @param requests - Every request.
 * @returns The entries.
 */
const catalogueEntriesOf = (
  held: readonly HeldTitle[],
  requests: readonly MediaRequest[],
): CatalogueEntry[] => {
  const heldByKey = new Map<string, HeldTitle>();
  const loose: HeldTitle[] = [];

  for (const title of held) {
    const key = matchKeyOf(title.kind, title.catalogueId, title.title, title.subtitle);

    if (key === null) {
      loose.push(title);
    } else if (!heldByKey.has(key)) {
      heldByKey.set(key, title);
    }
  }

  const asked = new Map<string, MediaRequest>();

  for (const request of requests) {
    const catalogueId =
      request.kind === 'artist' || request.kind === 'album'
        ? request.musicBrainzId
        : request.kind === 'book'
          ? null
          : (request.tmdbId?.toString() ?? null);
    const key = matchKeyOf(request.kind, catalogueId, request.title, request.artistName);

    if (key !== null && statusOfRequest(request) !== null) {
      asked.set(key, request);
    }
  }

  const entryOf = (
    key: string,
    title: HeldTitle | null,
    request: MediaRequest | null,
  ): CatalogueEntry => {
    const kind = title?.kind ?? request?.kind ?? 'film';
    const hereNow = request?.items.filter((item) => HERE.has(item.state)).length ?? 0;
    const heldNow = Math.max(title?.held ?? 0, hereNow);
    const status: TitleStatus =
      request === null ? 'notFollowed' : (statusOfRequest(request) ?? 'notFollowed');

    return {
      key,
      tab: TAB_OF[kind],
      kind,
      catalogueId:
        title?.catalogueId ??
        (request === null
          ? null
          : (request.musicBrainzId ??
            request.tmdbId?.toString() ??
            request.openLibraryId?.toString() ??
            null)),
      title: request?.title ?? title?.title ?? '',
      subtitle: title?.subtitle ?? request?.artistName ?? null,
      year: request?.year ?? title?.year ?? null,
      art: title?.art ?? null,
      posterUrl: request?.posterUrl ?? null,
      status,
      held: heldNow,
      total: Math.max(heldNow, request?.items.length ?? 0, title === null ? 0 : 1),
      isAudio: title?.isAudio ?? false,
      requestId: request?.id ?? null,
      mediaId: title?.id ?? request?.mediaId ?? null,
      libraryId: title?.libraryId ?? request?.libraryId ?? null,
      askedBy: request?.requestedBy ?? null,
      addedAt: title?.addedAt ?? request?.createdAt ?? null,
    };
  };

  return [
    ...[...heldByKey].map(([key, title]) => entryOf(key, title, asked.get(key) ?? null)),
    ...[...asked]
      .filter(([key]) => !heldByKey.has(key))
      .map(([key, request]) => entryOf(key, null, request)),
    ...loose.map((title) => entryOf(`${title.kind}:row:${title.id}`, title, null)),
  ];
};

export { catalogueEntriesOf };
