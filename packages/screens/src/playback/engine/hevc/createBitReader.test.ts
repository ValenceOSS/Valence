import { describe, expect, it } from 'vitest';
import { createBitReader } from '@ValenceScreens/playback/engine/hevc/createBitReader';

describe('createBitReader', () => {
  it('reads fixed fields most significant bit first', () => {
    const reader = createBitReader(Uint8Array.from([0b1011_0010]));

    expect(reader.bits(3)).toBe(0b101);
    expect(reader.bits(5)).toBe(0b10010);
  });

  it('reads Exp-Golomb codes, unsigned and signed', () => {
    const reader = createBitReader(Uint8Array.from([0b1_010_011_0, 0b0100_0000]));

    expect(reader.unsigned()).toBe(0);
    expect(reader.unsigned()).toBe(1);
    expect(reader.signed()).toBe(-1);
    expect(reader.signed()).toBe(2);
    expect(reader.at()).toBe(12);
  });

  it('refuses to read past the end', () => {
    expect(() => createBitReader(Uint8Array.from([0])).bits(9)).toThrow(RangeError);
  });
});
