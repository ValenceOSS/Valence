import { describe, expect, it } from 'vitest';
import type { SignInAttempt } from './describeSignInAttempt';
import { auditOfAuthRequest } from './auditOfAuthRequest';

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0 Safari/537.36';

const attempted = (attempt: Partial<SignInAttempt>): SignInAttempt => ({
  path: '/sign-in/email',
  statusCode: null,
  account: null,
  signedInAs: null,
  identifier: 'ada@example.com',
  userAgent: CHROME,
  brands: [],
  address: '203.0.113.7',
  ...attempt,
});

const ADA = { id: 'account-1', name: 'Ada' };

describe('auditOfAuthRequest', () => {
  it('records somebody signing in, how, and from where', () => {
    expect(auditOfAuthRequest(attempted({ account: ADA }))).toEqual({
      actorId: 'account-1',
      actorName: 'Ada',
      action: 'auth.signedIn',
      target: 'Ada',
      detail: { method: 'password' },
      address: '203.0.113.7',
      userAgent: CHROME,
    });
    expect(
      auditOfAuthRequest(attempted({ path: '/passkey/verify-authentication', account: ADA }))
        ?.detail,
    ).toEqual({ method: 'passkey' });
    expect(auditOfAuthRequest(attempted({ path: '/device/token', account: ADA }))?.detail).toEqual({
      method: 'deviceCode',
    });
  });

  it('records a refused sign-in against what was typed, with nobody as who, as one attempt', () => {
    expect(auditOfAuthRequest(attempted({ statusCode: 401 }))).toMatchObject({
      actorId: null,
      actorName: '',
      action: 'auth.signInFailed',
      target: 'ada@example.com',
      detail: { method: 'password', attempts: '1' },
    });
    expect(
      auditOfAuthRequest(attempted({ path: '/two-factor/verify-totp', statusCode: 401 }))?.action,
    ).toBe('auth.signInFailed');
  });

  it('leaves out a television still waiting for its code to be approved', () => {
    expect(auditOfAuthRequest(attempted({ path: '/device/token', statusCode: 400 }))).toBeNull();
  });

  it('records a change to how somebody signs in, once it has gone through', () => {
    expect(
      auditOfAuthRequest(attempted({ path: '/change-password', signedInAs: ADA })),
    ).toMatchObject({ actorId: 'account-1', action: 'auth.passwordChanged' });
    expect(
      auditOfAuthRequest(attempted({ path: '/two-factor/enable', signedInAs: ADA }))?.action,
    ).toBe('auth.twoFactorTurnedOn');
    expect(
      auditOfAuthRequest(attempted({ path: '/change-password', signedInAs: ADA, statusCode: 400 })),
    ).toBeNull();
  });

  it('records nothing for anything else the sign-in service answers', () => {
    expect(auditOfAuthRequest(attempted({ path: '/get-session', signedInAs: ADA }))).toBeNull();
    expect(auditOfAuthRequest(attempted({}))).toBeNull();
  });
});
