import { describe, expect, it } from 'vitest';
import { readRequestsSetup } from './readRequestsSetup';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

describe('readRequestsSetup', () => {
  it('is off when neither is given', () => {
    expect(readRequestsSetup('', '')).toEqual({ kind: 'off' });
  });

  it('is on when both are given', () => {
    expect(readRequestsSetup('http://requests:8421', A_SECRET)).toEqual({
      kind: 'on',
      address: 'http://requests:8421',
      secret: A_SECRET,
    });
  });

  it('names the address when only the secret was given', () => {
    expect(readRequestsSetup('', A_SECRET)).toEqual({
      kind: 'incomplete',
      missing: 'REQUESTS_URL',
    });
  });

  it('names the secret when only the address was given', () => {
    expect(readRequestsSetup('http://requests:8421', '')).toEqual({
      kind: 'incomplete',
      missing: 'REQUESTS_SECRET',
    });
  });

  it('names the secret when it is too short for the service to accept', () => {
    expect(readRequestsSetup('http://requests:8421', 'short')).toEqual({
      kind: 'incomplete',
      missing: 'REQUESTS_SECRET',
    });
  });
});
