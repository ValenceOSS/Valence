import { describe, expect, it } from 'vitest';
import { bucketIdFor } from './bucketIdFor';

describe('bucketIdFor', () => {
  it('makes a folder name out of what the bucket is called', () => {
    expect(bucketIdFor('Films in the Cloud!', new Set())).toBe('films-in-the-cloud');
  });

  it('numbers a name another bucket has already', () => {
    expect(bucketIdFor('Films', new Set(['films', 'films-2']))).toBe('films-3');
  });

  it('falls back to a name of its own where nothing usable was typed', () => {
    expect(bucketIdFor('☁️', new Set())).toBe('bucket');
  });
});
