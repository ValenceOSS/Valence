/**
 * Builds the address a styled track's Advanced SubStation script is served from, for a player
 * that draws the script whole.
 *
 * @param mediaId - The title.
 * @param trackId - The track.
 * @returns The address.
 */
const subtitleScriptUrl = (mediaId: string, trackId: string): string =>
  `/api/media/${mediaId}/subtitles/${trackId}/script`;

export { subtitleScriptUrl };
