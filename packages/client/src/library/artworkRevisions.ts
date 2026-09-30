const revisions = new Map<string, number>();

/**
 * Reads how many times an item's artwork has been changed from here, which is how its address
 * changes when a new picture is chosen for it.
 *
 * @param mediaId - The item.
 * @returns The count, or zero where nothing was changed.
 */
const of = (mediaId: string): number => revisions.get(mediaId) ?? 0;

/**
 * Notes that the artwork of some items has just been changed, so the next time each is drawn its
 * picture is asked for again rather than taken from what the browser kept.
 *
 * @param mediaIds - The items whose artwork changed.
 */
const bump = (mediaIds: readonly string[]): void => {
  for (const mediaId of mediaIds) {
    revisions.set(mediaId, (revisions.get(mediaId) ?? 0) + 1);
  }
};

const artworkRevisions = { of, bump };

export { artworkRevisions };
