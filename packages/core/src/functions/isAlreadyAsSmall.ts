const ROOM = 1.1;

type HeldFile = {
  isLossless: boolean;
  bitrateKbps: number | null;
};

/**
 * Whether a song's file is already about as small as an encode at a bitrate would be, so encoding
 * it again would only make it worse and no smaller. A lossless file never is; a lossy one is when
 * its bitrate is at or near the encode's, give or take the tenth a file's own bitrate varies by.
 *
 * @param file - Whether the file is lossless, and its bitrate where known.
 * @param kbps - The bitrate of the encode being weighed.
 * @returns Whether the file itself is as good a thing to send.
 */
const isAlreadyAsSmall = (file: HeldFile, kbps: number): boolean =>
  !file.isLossless && file.bitrateKbps !== null && file.bitrateKbps <= kbps * ROOM;

export { isAlreadyAsSmall };
