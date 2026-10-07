import { describe, expect, it } from 'vitest';
import { describeRequestState } from './describeRequestState';

describe('describeRequestState', () => {
  it('says where a request has got to in the requests page’s own words', () => {
    expect(describeRequestState('awaitingApproval')).toBe('Waiting for approval');
    expect(describeRequestState('refused')).toBe('Declined');
    expect(describeRequestState('wanted')).toBe('Requested');
    expect(describeRequestState('downloading')).toBe('Downloading');
    expect(describeRequestState('filed')).toBe('Importing');
    expect(describeRequestState('available')).toBe('Available');
    expect(describeRequestState('failed')).toBe('Stalled');
  });
});
