/**
 * Whether somebody here is shown among the sessions. Somebody watching through a linked server is
 * here only to play something, so once what they were playing has ended, such as when it is
 * stopped, they are not shown, while their connection is still let go of in its own time.
 *
 * @param entry - Who is here, where they came from, and what they are playing.
 * @returns Whether to show them.
 */
const isShownAsASession = (entry: {
  fromServer: string | null;
  playback: { mediaId: string } | null;
}): boolean => entry.fromServer === null || entry.playback !== null;

export { isShownAsASession };
