import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';

type Artwork = 'poster' | 'backdrop' | 'logo';

/**
 * Where the server keeps one of a title's pictures.
 *
 * A picture chosen for a programme as a whole — a backdrop, where each episode's own is a still from
 * that episode — is only given when the title itself is asked for, which is what `isOfTitle` says.
 * An item whose artwork was just changed from here is asked for under a new address, so the new
 * picture is shown at once rather than the one the browser kept.
 *
 * @param mediaId - The title, or the episode or cover standing for it.
 * @param kind - Which picture.
 * @param options - Whether the title's own picture is wanted rather than this file's.
 * @returns The path it is served from.
 */
const artworkUrl = (
  mediaId: string,
  kind: Artwork,
  options: { isOfTitle?: boolean } = {},
): string => {
  const query = new URLSearchParams();
  const revision = artworkRevisions.of(mediaId);

  if (options.isOfTitle === true) {
    query.set('of', 'title');
  }

  if (revision > 0) {
    query.set('v', revision.toString());
  }

  const asked = query.toString();

  return `/api/media/${mediaId}/image/${kind}${asked === '' ? '' : `?${asked}`}`;
};

export type { Artwork };

export { artworkUrl };
