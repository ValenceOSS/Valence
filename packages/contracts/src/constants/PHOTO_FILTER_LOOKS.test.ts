import { describe, expect, it } from 'vitest';
import { PHOTO_FILTERS } from '@ValenceContracts/schemas/ViewerProfile';
import { PHOTO_FILTER_LOOKS } from './PHOTO_FILTER_LOOKS';

describe('PHOTO_FILTER_LOOKS', () => {
  it('has a look for every filter, and leaves the original as it is', () => {
    expect(Object.keys(PHOTO_FILTER_LOOKS).sort()).toEqual([...PHOTO_FILTERS].sort());
    expect(PHOTO_FILTER_LOOKS.original).toEqual({
      saturate: 1,
      hueRotate: 0,
      contrast: 1,
      brightness: 1,
      layer: null,
    });
  });
});
