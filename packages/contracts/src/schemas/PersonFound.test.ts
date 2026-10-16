import { describe, expect, it } from 'vitest';
import { PersonFoundSchema } from './PersonFound';

describe('PersonFoundSchema', () => {
  it('reads somebody found, with or without a picture', () => {
    expect(
      PersonFoundSchema.parse({ personId: 1, name: 'Amy Adams', imageUrl: null, titleCount: 3 }),
    ).toEqual({ personId: 1, name: 'Amy Adams', imageUrl: null, titleCount: 3 });
  });

  it('refuses somebody the catalogue never identified', () => {
    expect(
      PersonFoundSchema.safeParse({ personId: 0, name: 'Nobody', imageUrl: null, titleCount: 1 })
        .success,
    ).toBe(false);
  });
});
