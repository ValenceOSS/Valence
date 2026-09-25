import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Where to read a still from a title — its backdrop, or its poster where it has no backdrop — or
 * nothing where it has neither.
 *
 * @param media - The title being drawn.
 * @returns The address, or nothing.
 */
const theStillFor = (media: MediaSummary): string | null =>
  media.hasBackdrop
    ? onThisServer(`/api/media/${media.id}/image/backdrop`)
    : media.hasPoster
      ? onThisServer(`/api/media/${media.id}/image/poster`)
      : null;

export { theStillFor };
