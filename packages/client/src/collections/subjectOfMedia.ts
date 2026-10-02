import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * What a title is as an entry of a collection: an episode stands for its whole programme, and
 * anything else is itself.
 *
 * @param media - A film, or an episode or card standing for a programme.
 * @returns The film or the programme.
 */
const subjectOfMedia = (media: Pick<MediaSummary, 'id' | 'seriesId'>): CollectionSubject =>
  media.seriesId === null ? { mediaItemId: media.id } : { seriesId: media.seriesId };

export { subjectOfMedia };
