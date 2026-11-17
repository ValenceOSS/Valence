import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * What a card stands for across a library: a programme by its series, whichever episode was read to
 * represent it, and a film by itself.
 *
 * @param media - A film, or one of a programme's episodes.
 * @returns What it is known by.
 */
const titleKeyOf = (media: Pick<MediaSummary, 'id' | 'seriesId' | 'seriesTitle'>): string =>
  media.seriesId ?? media.seriesTitle ?? media.id;

export { titleKeyOf };
