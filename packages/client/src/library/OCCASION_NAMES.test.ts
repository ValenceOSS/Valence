import { describe, expect, it } from 'vitest';
import { OCCASIONS } from '@ValenceContracts/constants/OCCASIONS';
import { say } from '@ValenceI18n/say';
import { OCCASION_NAMES } from './OCCASION_NAMES';

describe('OCCASION_NAMES', () => {
  it('names every occasion, each differently', () => {
    const names = OCCASIONS.map((occasion) => say(OCCASION_NAMES[occasion]));

    expect(new Set(names).size).toBe(OCCASIONS.length);
  });
});
