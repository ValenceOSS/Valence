import { artworkAddresses } from '@ValenceClient/library/artworkAddresses';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';

type Artwork = 'poster' | 'backdrop' | 'logo';

/**
 * Where the server keeps one of a title's pictures.
 *
 * A picture chosen for a programme as a whole — a backdrop, where each episode's own is a still
 * from that episode — is only given when the title itself is asked for, which is what `isOfTitle`
 * says. An item whose artwork was just changed from here is asked for under a new address, so the
 * new picture is shown at once rather than the one the browser kept.
 *
 * A grid asks for the small copy, and a wide card for the medium one, which the server narrows once
 * and keeps; a server too old to know the option sends the whole picture instead, which still
 * draws. Where the server has said where it serves that picture by name, the narrowed copy is asked
 * for there, which never changes and which anybody may fetch, so a browser keeps it for good and a
 * proxy or CDN in front of the server answers it without the server hearing of it. A Jellyfin
 * server's picture is named by an address that already carries a query, and takes its width as one
 * more.
 *
 * @param mediaId - The title, or the episode or cover standing for it.
 * @param kind - Which picture.
 * @param options - Whether the title's own picture is wanted rather than this file's, whether a
 *   poster with no lettering on it is, for a page that writes the title itself, and whether a
 *   narrowed copy will do.
 * @returns The path it is served from.
 */
const artworkUrl = (
  mediaId: string,
  kind: Artwork,
  options: { isOfTitle?: boolean; isBare?: boolean; size?: keyof typeof ARTWORK_WIDTHS } = {},
): string => {
  const query = new URLSearchParams();
  const revision = artworkRevisions.of(mediaId);
  const named =
    options.isBare === true
      ? undefined
      : artworkAddresses.of(mediaId, kind, revision, options.isOfTitle);

  if (named?.includes('?') === true) {
    return options.size === undefined
      ? named
      : `${named}&maxWidth=${ARTWORK_WIDTHS[options.size].toString()}`;
  }

  if (named !== undefined && options.size !== undefined) {
    return `${named}-w${ARTWORK_WIDTHS[options.size].toString()}.webp`;
  }

  if (options.isOfTitle === true) {
    query.set('of', 'title');
  }

  if (options.isBare === true) {
    query.set('lettering', 'none');
  }

  if (options.size !== undefined) {
    query.set('size', options.size);
  }

  if (revision > 0) {
    query.set('v', revision.toString());
  }

  const asked = query.toString();

  return `/api/media/${mediaId}/image/${kind}${asked === '' ? '' : `?${asked}`}`;
};

export type { Artwork };

export { artworkUrl };
