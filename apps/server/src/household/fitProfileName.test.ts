import { describe, expect, it } from 'vitest';
import { fitProfileName } from './fitProfileName';
import { NAME_MAX, ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';

const NAME_SCHEMA = ViewerProfileSchema.shape.name;

describe('fitProfileName', () => {
  it('leaves a name that fits alone', () => {
    expect(fitProfileName('The Smiths')).toBe('The Smiths');
    expect(fitProfileName('x'.repeat(NAME_MAX))).toBe('x'.repeat(NAME_MAX));
  });

  it('cuts a longer name to the limit, ending it with an ellipsis', () => {
    const fitted = fitProfileName('The household at the end of the long road');

    expect(fitted).toHaveLength(NAME_MAX);
    expect(fitted.endsWith('…')).toBe(true);
    expect(NAME_SCHEMA.safeParse(fitted).success).toBe(true);
  });

  it('measures emoji as the profile schema does, and never splits one', () => {
    const fitted = fitProfileName('😀'.repeat(NAME_MAX));

    expect(fitted).toBe(`${'😀'.repeat(11)}…`);
    expect(NAME_SCHEMA.safeParse(fitted).success).toBe(true);
  });

  it('keeps a character made of several joined emoji whole', () => {
    const family = '👨‍👩‍👧';
    const fitted = fitProfileName(`${'a'.repeat(NAME_MAX - 4)}${family}`);

    expect(fitted).toBe(`${'a'.repeat(NAME_MAX - 4)}…`);
    expect(NAME_SCHEMA.safeParse(fitted).success).toBe(true);
  });

  it('leaves no space before the ellipsis', () => {
    expect(fitProfileName(`${'a'.repeat(NAME_MAX - 2)} and more`)).toBe(
      `${'a'.repeat(NAME_MAX - 2)}…`,
    );
  });
});
