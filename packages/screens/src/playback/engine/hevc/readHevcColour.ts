import { createBitReader } from './createBitReader';
import type { BitReader } from './createBitReader';

type HevcColour = {
  primaries: number;
  transfer: number;
  matrix: number;
  isFullRange: boolean;
  colourBitAt: number | null;
};

/**
 * Steps over a profile, tier and level structure, which says nothing about colour.
 *
 * @param reader - Where the structure starts.
 * @param subLayers - How many sub-layers above the first the stream has.
 */
const skipProfileTierLevel = (reader: BitReader, subLayers: number) => {
  reader.skip(96);

  const present: { profile: boolean; level: boolean }[] = [];

  for (let layer = 0; layer < subLayers; layer += 1) {
    present.push({ profile: reader.bits(1) === 1, level: reader.bits(1) === 1 });
  }

  if (subLayers > 0) {
    reader.skip((8 - subLayers) * 2);
  }

  for (const layer of present) {
    reader.skip((layer.profile ? 88 : 0) + (layer.level ? 8 : 0));
  }
};

/**
 * Steps over the scaling lists a sequence may carry.
 *
 * @param reader - Where the lists start.
 */
const skipScalingLists = (reader: BitReader) => {
  for (let size = 0; size < 4; size += 1) {
    for (let matrix = 0; matrix < 6; matrix += size === 3 ? 3 : 1) {
      if (reader.bits(1) === 0) {
        reader.unsigned();
      } else {
        const coefficients = Math.min(64, 1 << (4 + (size << 1)));

        if (size > 1) {
          reader.signed();
        }

        for (let at = 0; at < coefficients; at += 1) {
          reader.signed();
        }
      }
    }
  }
};

/**
 * Steps over the short-term reference picture sets, keeping how many pictures each names, since a
 * set predicted from the one before it is only as long as that one.
 *
 * @param reader - Where the sets start.
 * @param count - How many sets there are.
 */
const skipShortTermSets = (reader: BitReader, count: number) => {
  const pictures: number[] = [];

  for (let set = 0; set < count; set += 1) {
    const isPredicted = set !== 0 && reader.bits(1) === 1;

    if (isPredicted) {
      reader.skip(1);
      reader.unsigned();

      let named = 0;

      for (let at = 0; at <= (pictures[set - 1] ?? 0); at += 1) {
        const isUsed = reader.bits(1) === 1;
        const isKept = isUsed || reader.bits(1) === 1;

        named += isKept ? 1 : 0;
      }

      pictures.push(named);
    } else {
      const before = reader.unsigned();
      const after = reader.unsigned();

      for (let at = 0; at < before + after; at += 1) {
        reader.unsigned();
        reader.skip(1);
      }

      pictures.push(before + after);
    }
  }
};

/**
 * What an H.265 sequence parameter set says about colour — its primaries, transfer and matrix, by
 * the numbers H.273 gives them, and whether its samples use the full range — and where in the
 * payload the primaries start, so they can be rewritten in place. A sequence that says nothing
 * about colour reports 2, unspecified, for all three and no place to rewrite.
 *
 * @param raw - The parameter set's payload, header included and emulation prevention removed.
 * @returns What it says about colour.
 */
const readHevcColour = (raw: Uint8Array): HevcColour => {
  const reader = createBitReader(raw);
  const unsaid: HevcColour = {
    primaries: 2,
    transfer: 2,
    matrix: 2,
    isFullRange: false,
    colourBitAt: null,
  };

  reader.skip(16 + 4);

  const subLayers = reader.bits(3);

  reader.skip(1);
  skipProfileTierLevel(reader, subLayers);
  reader.unsigned();

  if (reader.unsigned() === 3) {
    reader.skip(1);
  }

  reader.unsigned();
  reader.unsigned();

  if (reader.bits(1) === 1) {
    for (let side = 0; side < 4; side += 1) {
      reader.unsigned();
    }
  }

  reader.unsigned();
  reader.unsigned();

  const orderBits = reader.unsigned() + 4;
  const isOrderedPerLayer = reader.bits(1) === 1;

  for (let layer = isOrderedPerLayer ? 0 : subLayers; layer <= subLayers; layer += 1) {
    reader.unsigned();
    reader.unsigned();
    reader.unsigned();
  }

  for (let field = 0; field < 6; field += 1) {
    reader.unsigned();
  }

  if (reader.bits(1) === 1 && reader.bits(1) === 1) {
    skipScalingLists(reader);
  }

  reader.skip(2);

  if (reader.bits(1) === 1) {
    reader.skip(8);
    reader.unsigned();
    reader.unsigned();
    reader.skip(1);
  }

  skipShortTermSets(reader, reader.unsigned());

  if (reader.bits(1) === 1) {
    const longTerm = reader.unsigned();

    for (let picture = 0; picture < longTerm; picture += 1) {
      reader.skip(orderBits + 1);
    }
  }

  reader.skip(2);

  if (reader.bits(1) === 0) {
    return unsaid;
  }

  if (reader.bits(1) === 1 && reader.bits(8) === 255) {
    reader.skip(32);
  }

  if (reader.bits(1) === 1) {
    reader.skip(1);
  }

  if (reader.bits(1) === 0) {
    return unsaid;
  }

  reader.skip(3);

  const isFullRange = reader.bits(1) === 1;

  if (reader.bits(1) === 0) {
    return { ...unsaid, isFullRange };
  }

  const colourBitAt = reader.at();

  return {
    primaries: reader.bits(8),
    transfer: reader.bits(8),
    matrix: reader.bits(8),
    isFullRange,
    colourBitAt,
  };
};

export type { HevcColour };

export { readHevcColour };
