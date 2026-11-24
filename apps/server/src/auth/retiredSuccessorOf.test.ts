import { describe, expect, it } from 'vitest';
import { retiredSuccessorOf } from './retiredSuccessorOf';

describe('retiredSuccessorOf', () => {
  it('names the permission a retired one became, carried over or not', () => {
    expect(retiredSuccessorOf('server.logs')).toBe('server.monitor');
    expect(retiredSuccessorOf('account.ban')).toBe('account.manage');
  });

  it('says nothing of a name that was never retired', () => {
    expect(retiredSuccessorOf('account.manage')).toBeNull();
    expect(retiredSuccessorOf('nonsense')).toBeNull();
  });
});
