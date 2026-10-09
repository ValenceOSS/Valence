import { describe, expect, it } from 'vitest';
import { TITLE_STATUS_NAMES } from './TITLE_STATUS_NAMES';

describe('TITLE_STATUS_NAMES', () => {
  it('names every status a Catalogue title can be in', () => {
    expect(TITLE_STATUS_NAMES).toEqual({
      library: 'In the library',
      downloading: 'Downloading',
      missing: 'Missing',
      toApprove: 'To approve',
      failed: 'Failed',
      notFollowed: 'Not followed',
    });
  });
});
