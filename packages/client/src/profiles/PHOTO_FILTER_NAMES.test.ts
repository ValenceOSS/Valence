import { describe, expect, it } from 'vitest';
import { PHOTO_FILTERS } from '@ValenceContracts/schemas/ViewerProfile';
import { say } from '@ValenceI18n/say';
import { PHOTO_FILTER_NAMES } from './PHOTO_FILTER_NAMES';

describe('PHOTO_FILTER_NAMES', () => {
  it('names every filter, each differently', () => {
    const names = PHOTO_FILTERS.map((filter) => say(PHOTO_FILTER_NAMES[filter]));

    expect(new Set(names).size).toBe(PHOTO_FILTERS.length);
  });
});
