import { describe, expect, it } from 'vitest';
import { SEASONS } from '@ValenceContracts/constants/SEASONS';
import { say } from '@ValenceI18n/say';
import { SEASON_ROW_TITLES } from './SEASON_ROW_TITLES';

describe('SEASON_ROW_TITLES', () => {
  it('names a row for every season, each differently', () => {
    const titles = SEASONS.map((season) => say(SEASON_ROW_TITLES[season]));

    expect(titles).toStrictEqual(['Halloween films', 'Christmas films']);
  });
});
