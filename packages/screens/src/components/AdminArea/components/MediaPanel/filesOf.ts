import { isOneFile } from './isOneFile';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaTitle } from './MediaTitle.types';

/**
 * Every file a row stands for: the file itself, every episode of a series or season, or each
 * version of a title held more than once.
 *
 * @param title - The row.
 * @returns Its files.
 */
const filesOf = (title: MediaTitle): MediaSummary[] =>
  isOneFile(title)
    ? [title.lead]
    : title.episodes.length > 0
      ? title.episodes
      : title.parts.map((part) => part.lead);

export { filesOf };
