import type { EngineSupport } from './EngineSupport';

/**
 * How the browser plays a file the media element cannot play from the file by itself: repackaged
 * here for the element, which decodes the picture as it would any file of its own and shows HDR as
 * HDR; or through Valence's own player, which decodes with WebCodecs and draws with WebGPU.
 *
 * Repackaging is preferred wherever the element decodes the picture, since it costs least and keeps
 * the browser's own HDR. The player is chosen where it cannot, and for HDR HEVC on a screen that is
 * not HDR in any codec it can tone map, which Valence does itself rather than leaving the browser to
 * clip it.
 *
 * @param film - The film's picture codec, bit depth and range.
 * @param support - What the browser adds.
 * @param isHdrScreen - Whether the screen shows HDR.
 * @returns The route.
 */
const chooseBrowserRoute = (
  film: { videoCodec: string; videoBitDepth: number | null; videoRange: string },
  support: EngineSupport,
  isHdrScreen: boolean,
): 'remux' | 'webgpu' => {
  const isHdr = film.videoRange !== 'SDR';

  if (isHdr && !isHdrScreen && support.toneMappedCodecs.includes(film.videoCodec)) {
    return 'webgpu';
  }

  const isDeep = (film.videoBitDepth ?? 8) > 8;
  const isRemuxed = isDeep
    ? support.remuxTenBitVideoCodecs.includes(film.videoCodec)
    : support.remuxVideoCodecs.includes(film.videoCodec);

  return isRemuxed ? 'remux' : 'webgpu';
};

export { chooseBrowserRoute };
