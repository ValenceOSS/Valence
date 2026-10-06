import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * A title as the television's home screen is handed it: what to call it, whether it opens as a film
 * or a show, and the picture to show it by.
 *
 * @param media - The title.
 * @returns The title as the home screen takes it.
 */
const shelfEntryOf = (
  media: MediaSummary,
): { id: string; title: string; kind: string; imageUrl: string } => ({
  id: media.id,
  title: media.seriesTitle ?? media.title,
  kind: showIdOf(media) === null ? 'film' : 'show',
  imageUrl: onTheServer(artworkUrl(media.id, 'backdrop')),
});

export { shelfEntryOf };
