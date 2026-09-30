import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * How much of a series or an artist has arrived, counting only episodes that have aired and albums
 * that are out, and who an album is by.
 *
 * @param request - The request.
 * @returns Such as `Every season · 8 of 10 episodes here · 2 downloading`, `Albums, Live · 3 of 12
 *   albums here`, or `By Pink Floyd` — or null for a film.
 */
const describeRequestProgress = (request: MediaRequest): string | null => {
  if (request.kind === 'film') {
    return null;
  }

  if (request.kind === 'album') {
    return request.artistName === null
      ? null
      : say('client.requests.describeRequestProgress.byArtistName', {
          artistName: request.artistName,
        });
  }

  const out = request.items.filter((item) => item.state !== 'waiting');
  const here = out.filter((item) => item.state === 'available' || item.state === 'filed');
  const downloading = out.filter((item) => item.state === 'downloading').length;
  const asked =
    request.kind === 'artist'
      ? (request.releaseTypes ?? ['album']).map((type) => RELEASE_TYPE_NAMES[type].label).join(', ')
      : request.seasons === null
        ? say('common.everySeason')
        : sayCount('client.requests.describeRequestProgress.seasonsValue', request.seasons.length, {
            value: request.seasons.join(', '),
          });

  return [
    asked,
    sayCount(
      request.kind === 'artist'
        ? 'client.requests.describeRequestProgress.albumsHere'
        : 'client.requests.describeRequestProgress.episodesHere',
      out.length,
      { here: here.length.toString() },
    ),
    ...(downloading === 0 ? [] : [sayCount('common.count.downloading', downloading)]),
  ].join(' · ');
};

export { describeRequestProgress };
