import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * How much of a series has arrived, counting only episodes that have aired.
 *
 * @param request - The request.
 * @returns Such as `8 of 10 episodes here, 2 downloading`, or null for a film.
 */
const describeRequestProgress = (request: MediaRequest): string | null => {
  if (request.kind === 'film') {
    return null;
  }

  const out = request.items.filter((item) => item.state !== 'waiting');
  const here = out.filter((item) => item.state === 'available' || item.state === 'filed');
  const downloading = out.filter((item) => item.state === 'downloading').length;
  const seasons =
    request.seasons === null
      ? 'Every season'
      : `Season${request.seasons.length === 1 ? '' : 's'} ${request.seasons.join(', ')}`;

  return [
    seasons,
    `${here.length.toString()} of ${out.length.toString()} episode${out.length === 1 ? '' : 's'} here`,
    ...(downloading === 0 ? [] : [`${downloading.toString()} downloading`]),
  ].join(' · ');
};

export { describeRequestProgress };
