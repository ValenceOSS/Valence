import { describe, expect, it } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { describeCredit } from './describeCredit';
import type { PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * A credit on Dune with no part and no episodes, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The credit.
 */
const aCredit = (overrides: Partial<PersonCredit> = {}): PersonCredit => ({
  ...aCatalogueTitle(),
  role: null,
  episodeCount: null,
  ...overrides,
});

describe('describeCredit', () => {
  it('says the part somebody played in a film', () => {
    expect(describeCredit(aCredit({ role: 'Lady Jessica' }))).toBe('as Lady Jessica');
  });

  it('says how many episodes of a programme they were in, and as whom', () => {
    expect(describeCredit(aCredit({ kind: 'series', role: 'Mark', episodeCount: 19 }))).toBe(
      '19 episodes as Mark',
    );
    expect(describeCredit(aCredit({ kind: 'series', role: 'Mark', episodeCount: 1 }))).toBe(
      '1 episode as Mark',
    );
  });

  it('says only how many episodes where the part is not known', () => {
    expect(describeCredit(aCredit({ kind: 'series', episodeCount: 4 }))).toBe('4 episodes');
  });

  it('says only the part where a programme gives no count of episodes', () => {
    expect(describeCredit(aCredit({ kind: 'series', role: 'Mark' }))).toBe('as Mark');
  });

  it('counts no episodes for a film', () => {
    expect(describeCredit(aCredit({ role: 'Lady Jessica', episodeCount: 3 }))).toBe(
      'as Lady Jessica',
    );
  });

  it('says nothing where the catalogue gives neither', () => {
    expect(describeCredit(aCredit())).toBeUndefined();
    expect(describeCredit(aCredit({ kind: 'series' }))).toBeUndefined();
  });
});
