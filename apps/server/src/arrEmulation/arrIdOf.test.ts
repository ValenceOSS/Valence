import { describe, expect, it } from 'vitest';
import { arrIdOf } from './arrIdOf';

describe('arrIdOf', () => {
  it('reads the same number from the same identifier every time', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e';

    expect(arrIdOf(id)).toBe(arrIdOf(id));
    expect(arrIdOf(id)).toBe(0x0f8fad5);
  });

  it('tells two identifiers apart', () => {
    expect(arrIdOf('7c9e6679-7425-40de-944b-e07fc1f90ae7')).not.toBe(
      arrIdOf('0f8fad5b-d9cb-469f-a165-70867728950e'),
    );
  });

  it('never answers nought, which Overseerr reads as nothing', () => {
    expect(arrIdOf('00000000-0000-4000-8000-000000000000')).toBe(1);
    expect(arrIdOf('not-hex')).toBe(1);
  });
});
