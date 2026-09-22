import { showSlug } from '@ValenceCore/functions/showSlug';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * The programme an episode belongs to, as a programme's page is addressed: its series where the
 * scanner matched one, and a slug of its series title where it did not.
 *
 * @param media - The episode.
 * @returns The programme's id, or null for something that is not an episode of anything.
 */
const showIdOf = (media: Pick<MediaSummary, 'seriesId' | 'seriesTitle'>): string | null => {
  const id = media.seriesId ?? showSlug(media.seriesTitle ?? '');

  return id === '' ? null : id;
};

export { showIdOf };
