import { describe, expect, it } from 'vitest';
import { subjectKeyOf } from './subjectKeyOf';

describe('subjectKeyOf', () => {
  it('tells a film from a programme with the same id', () => {
    expect(subjectKeyOf({ mediaItemId: 'one' })).not.toBe(subjectKeyOf({ seriesId: 'one' }));
  });

  it('names the same film the same way twice', () => {
    expect(subjectKeyOf({ mediaItemId: 'one' })).toBe(subjectKeyOf({ mediaItemId: 'one' }));
  });
});
