/**
 * Whether a playlist is an HLS stream — one channel, in one or more qualities — rather than a list
 * of channels: HLS says so with its own tags, which a channel list never carries.
 *
 * @param text - The playlist.
 * @returns Whether it is a stream.
 */
const isHlsPlaylist = (text: string): boolean =>
  /^#EXT-X-(STREAM-INF|TARGETDURATION|MEDIA-SEQUENCE|INDEPENDENT-SEGMENTS|VERSION)/mu.test(text);

export { isHlsPlaylist };
