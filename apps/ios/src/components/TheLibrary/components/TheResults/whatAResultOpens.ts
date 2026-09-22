import { showSlug } from '@ValenceCore/functions/showSlug';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type WhatItOpens =
  { kind: 'title'; mediaId: string } | { kind: 'programme'; libraryId: string; showId: string };

/**
 * What pressing a search result should open.
 *
 * An episode that turned up in a search stands for its programme, not for itself: somebody who
 * typed the name of a series wanted the series, and opening the one episode that happened to match
 * first drops them into the middle of it. A film is itself.
 *
 * The programme is found the way the browser client finds it — by its series where the library
 * knows one, and by its name where it only knows that.
 *
 * @param media - The result that was pressed.
 * @returns Where it leads.
 */
const whatAResultOpens = (media: MediaSummary): WhatItOpens => {
  const series = media.seriesId ?? (media.seriesTitle ? showSlug(media.seriesTitle) : '');

  return series === ''
    ? { kind: 'title', mediaId: media.id }
    : { kind: 'programme', libraryId: media.libraryId, showId: series };
};

export type { WhatItOpens };

export { whatAResultOpens };
