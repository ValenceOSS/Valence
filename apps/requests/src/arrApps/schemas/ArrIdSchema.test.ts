import { describe, expect, it } from 'vitest';
import { ArrIdSchema } from './ArrIdSchema';

describe('ArrIdSchema', () => {
  it('reads the id of what an app just added', () => {
    expect(ArrIdSchema.parse({ title: 'Dune', tmdbId: 438_631, id: 12 })).toEqual({ id: 12 });
  });
});
