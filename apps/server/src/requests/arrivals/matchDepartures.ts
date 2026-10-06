import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';
import type { HeldKind } from '@ValenceServer/requests/arrivals/HeldKind';

type Departure = { request: MediaRequest; mediaId: string | null };

type MatchDeparturesOptions = {
  requests: readonly MediaRequest[];
  held: (kind: HeldKind, mediaIds: readonly string[]) => Promise<ReadonlySet<string>>;
  lookup: Pick<CatalogueLookup, 'films' | 'series' | 'albums'>;
};

/**
 * Which kind of thing in the library a request's item is: the film, the series, or the album.
 *
 * @param request - The request.
 * @returns The kind, or null for a book, which is not followed.
 */
const heldKindOf = (request: MediaRequest): HeldKind | null => {
  if (isMusicRequest(request.kind)) {
    return 'album';
  }

  return request.kind === 'film' || request.kind === 'series' ? request.kind : null;
};

/**
 * Where the library holds a request's title now, looked up by its catalogue ids as an arrival is.
 *
 * @param request - The request.
 * @param lookup - The libraries, looked into by catalogue ids.
 * @returns The item it is held as, or null where the library no longer holds it.
 */
const heldNowAs = async (
  request: MediaRequest,
  lookup: MatchDeparturesOptions['lookup'],
): Promise<string | null> => {
  if (isMusicRequest(request.kind)) {
    const albums = await lookup.albums(
      request.items.flatMap((item) => (item.musicBrainzId === null ? [] : [item.musicBrainzId])),
    );
    const [first] = albums.values();

    return first ?? null;
  }

  if (request.tmdbId === null) {
    return null;
  }

  const tmdbId = request.tmdbId.toString();
  const found = await (request.kind === 'film' ? lookup.films : lookup.series)([tmdbId]);

  return found.get(tmdbId) ?? null;
};

/**
 * Every request whose item the library no longer holds under the id it arrived as: followed to the
 * item the library holds it as now, where a scan found it again under another, or let go where the
 * library holds it no more.
 *
 * @param requests - Every request.
 * @param held - Which of some films, series or albums the libraries still hold.
 * @param lookup - The libraries, looked into by catalogue ids.
 * @returns Each request whose item left, and what it is now, if anything.
 */
const matchDepartures = async ({
  requests,
  held,
  lookup,
}: MatchDeparturesOptions): Promise<Departure[]> => {
  const linked = requests.flatMap((request) => {
    const kind = heldKindOf(request);

    return kind === null || request.mediaId === null
      ? []
      : [{ request, kind, mediaId: request.mediaId }];
  });
  const kinds = [...new Set(linked.map((one) => one.kind))];
  const stillHeld = new Map(
    await Promise.all(
      kinds.map(
        async (kind) =>
          [
            kind,
            await held(
              kind,
              linked.filter((one) => one.kind === kind).map((one) => one.mediaId),
            ),
          ] as const,
      ),
    ),
  );
  const departed: Departure[] = [];

  for (const { request, kind, mediaId } of linked) {
    if (stillHeld.get(kind)?.has(mediaId) === true) {
      continue;
    }

    const now = await heldNowAs(request, lookup);

    if (now !== mediaId) {
      departed.push({ request, mediaId: now });
    }
  }

  return departed;
};

export type { Departure };

export { matchDepartures };
