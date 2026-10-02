import { describe, expect, it } from 'vitest';
import { accountHandleOf } from './accountHandleOf';

describe('accountHandleOf', () => {
  it('names an account by its username', () => {
    expect(accountHandleOf({ username: 'Ada', email: 'ada@example.com' })).toBe('@Ada');
  });

  it('falls back on the address', () => {
    expect(accountHandleOf({ username: null, email: 'ada@example.com' })).toBe('ada@example.com');
  });

  it('says nothing where it has neither', () => {
    expect(accountHandleOf({ username: null, email: null })).toBe('');
  });
});
