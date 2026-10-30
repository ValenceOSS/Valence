import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { usePictureTint } from '@ValenceMobile/hooks/usePictureTint';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';

/**
 * The colour a card about something is tinted with on a dark page, taken from its backdrop.
 *
 * @param mediaId - Whose backdrop to read, or nothing while there is none.
 * @returns The tint, or nothing on a light page or where the artwork gave no colour.
 */
const useArtworkTint = (mediaId: string | null): string | null =>
  usePictureTint(
    mediaId === null ? null : onThisServer(artworkUrl(mediaId, 'backdrop', { size: 'small' })),
  );

export { useArtworkTint };
