import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { meterOf } from './meterOf';

describe('meterOf', () => {
  it('fills a title still on its way to how much is held, and says so', () => {
    expect(
      meterOf(aCatalogueEntry({ status: 'downloading', held: 3, total: 12, kind: 'series' })),
    ).toEqual({ fraction: 0.25, tone: 'busy', label: 'Downloading · 3 of 12' });
  });

  it('fills a whole bar for a title that is settled one way or the other', () => {
    expect(meterOf(aCatalogueEntry({ status: 'toApprove', held: 0 }))).toEqual({
      fraction: 1,
      tone: 'highlight',
      label: 'To approve',
    });
  });

  it('draws what is missing as the gap left', () => {
    expect(meterOf(aCatalogueEntry({ status: 'missing', held: 0, total: 1 }))).toMatchObject({
      fraction: 0,
      tone: 'gap',
    });
  });
});
