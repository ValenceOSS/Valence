/**
 * Where to draw a picture kept on the server rather than at the catalogue, one beside a title's
 * files or one uploaded, for an administrator choosing between them. A catalogue's picture is
 * drawn from its own address.
 *
 * @param mediaId - Any file of the title.
 * @param url - The picture's address.
 * @returns Where to draw it.
 */
const ownArtworkUrl = (mediaId: string, url: string): string =>
  url.startsWith('valence-')
    ? `/api/media/${mediaId}/artwork/picture?url=${encodeURIComponent(url)}`
    : url;

export { ownArtworkUrl };
