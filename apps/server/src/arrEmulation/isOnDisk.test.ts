import { describe, expect, it } from 'vitest';
import { isOnDisk } from './isOnDisk';

describe('isOnDisk', () => {
  it('counts a request filed or available as on disk', () => {
    expect(isOnDisk({ state: 'filed' })).toBe(true);
    expect(isOnDisk({ state: 'available' })).toBe(true);
  });

  it('does not count one still being fetched', () => {
    expect(isOnDisk({ state: 'downloading' })).toBe(false);
    expect(isOnDisk({ state: 'awaitingApproval' })).toBe(false);
  });
});
