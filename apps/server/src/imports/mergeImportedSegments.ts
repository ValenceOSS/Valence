import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { SourceMarker } from './SourceReader';

/**
 * Puts markers read from the old server beside what Valence already knows about an item, replacing
 * what it found for itself but never what somebody marked by hand.
 *
 * @param existing - The item's segments now.
 * @param imported - The markers the old server held.
 * @returns The segments to keep, or null where nothing changes.
 */
const mergeImportedSegments = (
  existing: readonly MediaSegment[],
  imported: readonly SourceMarker[],
): MediaSegment[] | null => {
  const merged = new Map(existing.map((segment) => [segment.kind, segment]));
  let changed = false;

  for (const marker of imported) {
    const held = merged.get(marker.kind);

    if (held?.source === 'manual') {
      continue;
    }

    const next: MediaSegment = {
      kind: marker.kind,
      startSeconds: Math.max(marker.startSeconds, 0),
      endSeconds: marker.endSeconds,
      source: 'imported',
    };

    if (
      held === undefined ||
      held.source !== next.source ||
      Math.abs(held.startSeconds - next.startSeconds) > 0.01 ||
      Math.abs(held.endSeconds - next.endSeconds) > 0.01
    ) {
      merged.set(marker.kind, next);
      changed = true;
    }
  }

  return changed ? [...merged.values()] : null;
};

export { mergeImportedSegments };
