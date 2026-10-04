import { describe, expect, it } from 'vitest';
import { whatWindowsSaid } from './whatWindowsSaid';

describe('whatWindowsSaid', () => {
  it('reads a closed prompt as somebody changing their mind', () => {
    expect(whatWindowsSaid(new Error('NotAllowedError'))).toEqual({ kind: 'cancelled' });
  });

  it('says a passkey already made here is already here', () => {
    expect(whatWindowsSaid(new Error('InvalidStateError'))).toEqual({
      kind: 'failed',
      reason: 'This device already has a passkey for this account.',
    });
  });

  it('says something plain about anything else', () => {
    expect(whatWindowsSaid(new Error('UnknownError'))).toEqual({
      kind: 'failed',
      reason: 'Windows couldn’t use a passkey. Try again.',
    });
    expect(whatWindowsSaid(null)).toMatchObject({ kind: 'failed' });
  });
});
