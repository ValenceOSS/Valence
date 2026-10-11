type BitReader = {
  bits: (count: number) => number;
  skip: (count: number) => void;
  unsigned: () => number;
  signed: () => number;
  at: () => number;
};

/**
 * Reads a bitstream a bit at a time, most significant bit first, including the Exp-Golomb codes
 * H.265 numbers most of its fields with. Reading past the end throws, so a damaged header is
 * refused rather than misread.
 *
 * @param bytes - What to read.
 * @returns The reader.
 */
const createBitReader = (bytes: Uint8Array): BitReader => {
  const state = { at: 0 };

  const bit = (): number => {
    const byte = bytes[state.at >> 3];

    if (byte === undefined) {
      throw new RangeError('The header ended early.');
    }

    const value = (byte >> (7 - (state.at & 7))) & 1;

    state.at += 1;

    return value;
  };

  const bits = (count: number): number => {
    let value = 0;

    for (let read = 0; read < count; read += 1) {
      value = value * 2 + bit();
    }

    return value;
  };

  const unsigned = (): number => {
    let zeros = 0;

    while (bit() === 0) {
      zeros += 1;

      if (zeros > 31) {
        throw new RangeError('The header holds a number too long to read.');
      }
    }

    return 2 ** zeros - 1 + bits(zeros);
  };

  return {
    bits,
    skip: (count) => {
      bits(count);
    },
    unsigned,
    signed: () => {
      const code = unsigned();

      return code % 2 === 0 ? -(code / 2) : (code + 1) / 2;
    },
    at: () => state.at,
  };
};

export type { BitReader };

export { createBitReader };
