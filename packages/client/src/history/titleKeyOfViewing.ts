import type { Viewing } from '@ValenceContracts/schemas/Viewing';

/**
 * Names the title a viewing was of: the programme for an episode, the film itself otherwise.
 *
 * @param viewing - The viewing.
 * @returns What every viewing of the same title shares.
 */
const titleKeyOfViewing = (viewing: Viewing): string =>
  viewing.seriesTitle === null
    ? `item:${viewing.mediaItemId}`
    : `show:${viewing.seriesId ?? viewing.seriesTitle}`;

export { titleKeyOfViewing };
