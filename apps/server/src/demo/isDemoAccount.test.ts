import { describe, expect, it } from 'vitest';
import { isDemoAccount } from './isDemoAccount';

describe('isDemoAccount', () => {
  it('knows a demo account by its username, whatever its case', () => {
    expect(isDemoAccount({ username: 'demo' }, ['demo'])).toBe(true);
    expect(isDemoAccount({ username: 'Demo' }, ['demo'])).toBe(true);
  });

  it('leaves every other account alone', () => {
    expect(isDemoAccount({ username: 'valenceadmin' }, ['demo'])).toBe(false);
    expect(isDemoAccount({ username: null }, ['demo'])).toBe(false);
    expect(isDemoAccount({}, ['demo'])).toBe(false);
  });

  it('finds none where the server names none', () => {
    expect(isDemoAccount({ username: 'demo' }, [])).toBe(false);
  });
});
