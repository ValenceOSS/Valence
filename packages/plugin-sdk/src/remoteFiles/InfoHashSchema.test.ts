import { describe, expect, it } from 'vitest';
import { InfoHashSchema } from './InfoHashSchema';

describe('InfoHashSchema', () => {
  it('accepts 40 lower-case hex characters', () => {
    expect(InfoHashSchema.safeParse('c12fe1c06bba254a9dc9f519b335aa7c1367a88a').success).toBe(true);
  });

  it.each(['C12FE1C06BBA254A9DC9F519B335AA7C1367A88A', 'c12fe1', 'z'.repeat(40)])(
    'refuses %s',
    (hash) => {
      expect(InfoHashSchema.safeParse(hash).success).toBe(false);
    },
  );
});
