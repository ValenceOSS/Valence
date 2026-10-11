import { createBitReader } from '@ValenceScreens/playback/engine/hevc/createBitReader';
import type { BitReader } from '@ValenceScreens/playback/engine/hevc/createBitReader';

type Av1Colour = {
  primaries: number;
  transfer: number;
  matrix: number;
  isFullRange: boolean;
  colourBitAt: number | null;
};

/**
 * Reads a variable-length number as AV1's uvlc writes it.
 *
 * @param reader - Where it starts.
 */
const skipUvlc = (reader: BitReader) => {
  let zeros = 0;

  while (reader.bits(1) === 0) {
    zeros += 1;
  }

  if (zeros < 32) {
    reader.skip(zeros);
  }
};

/**
 * What an AV1 sequence header says about colour — its primaries, transfer and matrix by the numbers
 * H.273 gives them, and whether its samples use the full range — and where in the header the
 * primaries start, so they can be rewritten in place. A header that says nothing about colour
 * reports 2, unspecified, for all three and no place to rewrite.
 *
 * @param header - The sequence header's payload, after its OBU header and size.
 * @returns What it says about colour.
 */
const readAv1Colour = (header: Uint8Array): Av1Colour => {
  const reader = createBitReader(header);
  const profile = reader.bits(3);

  reader.skip(1);

  const isReduced = reader.bits(1) === 1;
  const state = { hasDecoderModel: false, bufferDelayBits: 0, hasOrderHint: false };

  if (isReduced) {
    reader.skip(5);
  } else {
    if (reader.bits(1) === 1) {
      reader.skip(64);

      if (reader.bits(1) === 1) {
        skipUvlc(reader);
      }

      state.hasDecoderModel = reader.bits(1) === 1;

      if (state.hasDecoderModel) {
        state.bufferDelayBits = reader.bits(5) + 1;
        reader.skip(32 + 5 + 5);
      }
    }

    const hasDisplayDelay = reader.bits(1) === 1;
    const points = reader.bits(5) + 1;

    for (let point = 0; point < points; point += 1) {
      reader.skip(12);

      if (reader.bits(5) > 7) {
        reader.skip(1);
      }

      if (state.hasDecoderModel && reader.bits(1) === 1) {
        reader.skip(state.bufferDelayBits * 2 + 1);
      }

      if (hasDisplayDelay && reader.bits(1) === 1) {
        reader.skip(4);
      }
    }
  }

  const widthBits = reader.bits(4) + 1;
  const heightBits = reader.bits(4) + 1;

  reader.skip(widthBits + heightBits);

  if (!isReduced && reader.bits(1) === 1) {
    reader.skip(4 + 3);
  }

  reader.skip(3);

  if (!isReduced) {
    reader.skip(4);
    state.hasOrderHint = reader.bits(1) === 1;

    if (state.hasOrderHint) {
      reader.skip(2);
    }

    const forcesScreenContent = reader.bits(1) === 1 ? 2 : reader.bits(1);

    if (forcesScreenContent > 0 && reader.bits(1) === 0) {
      reader.skip(1);
    }

    if (state.hasOrderHint) {
      reader.skip(3);
    }
  }

  reader.skip(3);

  if (reader.bits(1) === 1 && profile === 2) {
    reader.skip(1);
  }

  if (profile !== 1) {
    reader.skip(1);
  }

  if (reader.bits(1) === 0) {
    return {
      primaries: 2,
      transfer: 2,
      matrix: 2,
      isFullRange: reader.bits(1) === 1,
      colourBitAt: null,
    };
  }

  const colourBitAt = reader.at();
  const primaries = reader.bits(8);
  const transfer = reader.bits(8);
  const matrix = reader.bits(8);
  const isRgb = primaries === 1 && transfer === 13 && matrix === 0;

  return { primaries, transfer, matrix, isFullRange: isRgb || reader.bits(1) === 1, colourBitAt };
};

export type { Av1Colour };

export { readAv1Colour };
