import { readPlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';

/**
 * Which description of a stream the player loads: the DASH one where this device asked for DASH and
 * the server wrote one, and otherwise the HLS playlist, which every session has.
 *
 * @param delivery - How the server is sending the stream.
 * @param delivery.manifestUrl - Where its HLS playlist is.
 * @param delivery.dashUrl - Where its DASH manifest is, where it has one.
 * @returns The address to load and which format it is.
 */
const manifestToLoad = (delivery: {
  manifestUrl: string;
  dashUrl: string | null;
}): { url: string; format: 'hls' | 'dash' } =>
  readPlaybackPreferences().streamingFormat === 'dash' && delivery.dashUrl !== null
    ? { url: delivery.dashUrl, format: 'dash' }
    : { url: delivery.manifestUrl, format: 'hls' };

export { manifestToLoad };
