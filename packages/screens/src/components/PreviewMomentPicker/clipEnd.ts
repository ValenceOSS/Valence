/**
 * Works out the second a preview clip ends at, so the frame it finishes on can be shown beside the
 * one it starts on. A clip cannot run past the last second of the item.
 *
 * @param startSeconds - The second the clip starts at.
 * @param lengthSeconds - How long the clip runs.
 * @param lastSecond - The last second of the item.
 * @returns The second the clip ends at.
 */
const clipEnd = (startSeconds: number, lengthSeconds: number, lastSecond: number): number =>
  Math.min(startSeconds + lengthSeconds, lastSecond);

export { clipEnd };
