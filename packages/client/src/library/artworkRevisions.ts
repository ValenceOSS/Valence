const revisions = new Map<string, number>();

/**
 * Reads which revision of an item's artwork to ask for, which is how its address changes when a new
 * picture is chosen for it, here or anywhere else.
 *
 * @param mediaId - The item.
 * @returns The revision, or zero where its pictures never changed.
 */
const of = (mediaId: string): number => revisions.get(mediaId) ?? 0;

/**
 * Notes the revision the server gave an item's artwork, keeping whichever is newer, so its pictures
 * are asked for under the address the server last changed them at.
 *
 * @param entries - The items read, each with the revision the server sent, where it sent one.
 */
const learn = (entries: readonly { id: string; artworkRevision?: number | undefined }[]): void => {
  for (const { id, artworkRevision } of entries) {
    if (artworkRevision !== undefined && artworkRevision > of(id)) {
      revisions.set(id, artworkRevision);
    }
  }
};

/**
 * Notes that the artwork of some items has just been changed from here, so the next time each is
 * drawn its picture is asked for again rather than taken from what the browser kept.
 *
 * @param mediaIds - The items whose artwork changed.
 * @param now - The clock.
 */
const bump = (mediaIds: readonly string[], now: () => number = Date.now): void => {
  for (const mediaId of mediaIds) {
    revisions.set(mediaId, Math.max(now(), of(mediaId) + 1));
  }
};

const artworkRevisions = { of, learn, bump };

export { artworkRevisions };
