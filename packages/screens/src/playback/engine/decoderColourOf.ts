import { z } from 'zod';

const DecoderColourSchema = z.custom<VideoColorSpaceInit>(
  (value) => typeof value === 'object' && value !== null,
);

/**
 * The colour a decoder is told its frames are when their stream has been made to say nothing: sRGB
 * primaries and transfer, so the browser leaves the HDR signal alone, with the stream's own matrix
 * and range, so it still turns YUV into RGB correctly. Built through a schema because TypeScript's
 * DOM types predate the `bt2020-ncl` matrix WebCodecs accepts.
 *
 * @param isBt2020 - Whether the stream uses the BT.2020 matrix rather than BT.709's.
 * @param isFullRange - Whether its samples use the full range.
 * @returns The colour to configure the decoder with.
 */
const decoderColourOf = (isBt2020: boolean, isFullRange: boolean): VideoColorSpaceInit =>
  DecoderColourSchema.parse({
    primaries: 'bt709',
    transfer: 'iec61966-2-1',
    matrix: isBt2020 ? 'bt2020-ncl' : 'bt709',
    fullRange: isFullRange,
  });

export { decoderColourOf };
