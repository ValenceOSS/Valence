import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { countTitleStatuses } from './countTitleStatuses';

describe('countTitleStatuses', () => {
  it('counts each status, none where there are none', () => {
    expect(
      countTitleStatuses([
        aCatalogueEntry({ status: 'failed' }),
        aCatalogueEntry({ status: 'failed' }),
        aCatalogueEntry({ status: 'library' }),
      ]),
    ).toEqual({
      library: 1,
      downloading: 0,
      missing: 0,
      toApprove: 0,
      failed: 2,
      notFollowed: 0,
    });
  });
});
