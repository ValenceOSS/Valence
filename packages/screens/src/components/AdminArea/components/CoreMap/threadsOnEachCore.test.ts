import { describe, expect, it } from 'vitest';
import { threadsOnEachCore } from './threadsOnEachCore';

describe('threadsOnEachCore', () => {
  it('gives every core the same threads on a chip whose cores are alike', () => {
    expect(threadsOnEachCore(4, 8)).toEqual([2, 2, 2, 2]);
  });

  it('gives the left-over threads to the first cores, as a fast-and-efficient chip lays them out', () => {
    expect(threadsOnEachCore(14, 20)).toEqual([2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('draws one thread to a core where the cores could not be counted', () => {
    expect(threadsOnEachCore(null, 3)).toEqual([1, 1, 1]);
  });

  it('draws one thread to a core where the counts cannot both be right', () => {
    expect(threadsOnEachCore(8, 4)).toEqual([1, 1, 1, 1]);
  });
});
