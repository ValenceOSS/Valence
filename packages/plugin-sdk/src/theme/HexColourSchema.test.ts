import { describe, expect, it } from 'vitest';
import { HexColourSchema } from './HexColourSchema';

describe('HexColourSchema', () => {
  it.each(['#000000', '#a1b2c3'])('accepts %s', (colour) => {
    expect(HexColourSchema.safeParse(colour).success).toBe(true);
  });

  it.each(['#FFF', '#FFFFFF', 'red', 'rgb(0,0,0)', '#ffffff; background:url(x)', 'var(--x)'])(
    'refuses %s',
    (colour) => {
      expect(HexColourSchema.safeParse(colour).success).toBe(false);
    },
  );
});
