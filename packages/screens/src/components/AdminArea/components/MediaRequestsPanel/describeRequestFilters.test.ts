import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { describeRequestFilters } from './describeRequestFilters';

describe('describeRequestFilters', () => {
  it('offers every kind that can be asked for, whether or not any have been', () => {
    const [kind] = describeRequestFilters([]);

    expect(kind?.options.map((option) => option.label)).toEqual([
      'Film',
      'Series',
      'Artist',
      'Album',
      'Book',
    ]);
  });

  it('offers only the places requests actually are, once each and in order', () => {
    const [, where] = describeRequestFilters([
      aMediaRequest({ state: 'refused' }),
      aMediaRequest({ state: 'awaitingApproval' }),
      aMediaRequest({ state: 'refused' }),
    ]);

    expect(where?.options.map((option) => option.label)).toEqual(['Awaiting approval', 'Refused']);
  });
});
