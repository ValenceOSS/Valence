import { describe, expect, it } from 'vitest';
import { fitProfileName } from './fitProfileName';
import { NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';

describe('fitProfileName', () => {
  it('leaves a name that fits alone', () => {
    expect(fitProfileName('The Smiths')).toBe('The Smiths');
    expect(fitProfileName('x'.repeat(NAME_MAX))).toBe('x'.repeat(NAME_MAX));
  });

  it('cuts a longer name to the limit, ending it with an ellipsis', () => {
    const fitted = fitProfileName('The household at the end of the long road');

    expect(Array.from(fitted)).toHaveLength(NAME_MAX);
    expect(fitted.endsWith('…')).toBe(true);
  });

  it('never splits a character made of two code units, nor leaves a space before the ellipsis', () => {
    const fitted = fitProfileName(`${'😀'.repeat(NAME_MAX - 2)} and more after`);

    expect(fitted).toBe(`${'😀'.repeat(NAME_MAX - 2)}…`);
  });
});
