import { describe, expect, it } from 'vitest';
import { PHOTO_FILTER_LOOKS } from '@ValenceContracts/constants/PHOTO_FILTER_LOOKS';
import { toneOfFilter } from './toneOfFilter';

describe('toneOfFilter', () => {
  it('leaves a picture with no filter as it is', () => {
    expect(toneOfFilter(undefined)).toEqual({
      saturate: 1,
      hueRotate: 0,
      contrast: 1,
      brightness: 1,
      layer: null,
    });
  });

  it('draws a picture in the filter chosen for it', () => {
    expect(toneOfFilter('psychedelic')).toBe(PHOTO_FILTER_LOOKS.psychedelic);
  });
});
