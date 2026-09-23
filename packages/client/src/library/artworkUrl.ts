type Artwork = 'poster' | 'backdrop' | 'logo';

/**
 * Where the server keeps one of a title's pictures.
 *
 * @param mediaId - The title, or the episode or cover standing for it.
 * @param kind - Which picture.
 * @returns The path it is served from.
 */
const artworkUrl = (mediaId: string, kind: Artwork): string =>
  `/api/media/${mediaId}/image/${kind}`;

export type { Artwork };

export { artworkUrl };
