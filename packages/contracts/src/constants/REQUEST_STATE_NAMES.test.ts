import { describe, expect, it } from 'vitest';
import { REQUEST_STATE_NAMES } from './REQUEST_STATE_NAMES';

describe('REQUEST_STATE_NAMES', () => {
  it('names each state a request can be in with the same words on every screen', () => {
    expect(REQUEST_STATE_NAMES).toEqual({
      awaitingApproval: 'Waiting for approval',
      refused: 'Declined',
      waiting: 'Requested',
      wanted: 'Missing',
      searching: 'Searching',
      chosen: 'Downloading',
      downloading: 'Downloading',
      filing: 'Importing',
      filed: 'Importing',
      available: 'In the library',
      failed: 'Failed',
    });
  });
});
