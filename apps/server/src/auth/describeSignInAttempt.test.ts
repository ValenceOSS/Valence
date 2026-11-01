import { describe, expect, it } from 'vitest';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { describeSignInAttempt } from './describeSignInAttempt';
import type { SignInAttempt } from './describeSignInAttempt';

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0 Safari/537.36';

const attempted = (attempt: Partial<SignInAttempt>): SignInAttempt => ({
  path: '/sign-in/email',
  statusCode: null,
  account: null,
  signedInAs: null,
  identifier: 'ada@example.com',
  userAgent: CHROME,
  device: {
    deviceId: null,
    identity: identifyDevice({ userAgent: CHROME, brands: ['Google Chrome', 'Chromium'] }),
  },
  address: '203.0.113.7',
  ...attempt,
});

describe('describeSignInAttempt', () => {
  it('reports somebody signing in, with the device they used', () => {
    const occurrence = describeSignInAttempt(
      attempted({ account: { id: 'account-1', name: 'Ada' } }),
    );

    expect(occurrence).toStrictEqual({
      event: 'auth.succeeded',
      data: {
        accountId: 'account-1',
        name: 'Ada',
        deviceLabel: 'Mac',
        clientLabel: 'Chrome on macOS',
        address: '203.0.113.7',
      },
    });
  });

  it('names the device and what it reached Valence through apart', () => {
    const occurrence = describeSignInAttempt(
      attempted({
        account: { id: 'account-1', name: 'Ada' },
        device: {
          deviceId: 'phone-device',
          identity: identifyDevice({
            userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0',
            kind: 'phone',
            hints: { system: 'ios', model: 'iPhone 17 Pro Max' },
          }),
        },
      }),
    );

    expect(occurrence?.data).toMatchObject({
      deviceLabel: 'iPhone 17 Pro Max',
      clientLabel: 'Valence for iOS',
    });
  });

  it('names a device what its owner renamed it to', () => {
    const occurrence = describeSignInAttempt(
      attempted({ account: { id: 'account-1', name: 'Ada' } }),
      'Office Mac',
    );

    expect(occurrence?.data).toMatchObject({
      deviceLabel: 'Office Mac',
      clientLabel: 'Chrome on macOS',
    });
  });

  it('reports a television signing in with a code once its code is approved', () => {
    const occurrence = describeSignInAttempt(
      attempted({
        path: '/device/token',
        statusCode: 200,
        account: { id: 'account-1', name: 'Ada' },
      }),
    );

    expect(occurrence?.event).toBe('auth.succeeded');
  });

  it('says nothing about a television turned away while its code waits to be approved', () => {
    expect(describeSignInAttempt(attempted({ path: '/device/token', statusCode: 400 }))).toBeNull();
    expect(describeSignInAttempt(attempted({ path: '/device/token', statusCode: 401 }))).toBeNull();
  });

  it('reports a refusal against the identifier that was tried', () => {
    const occurrence = describeSignInAttempt(attempted({ statusCode: 401 }));

    expect(occurrence?.event).toBe('auth.failed');
    expect(occurrence?.data).toMatchObject({ identifier: 'ada@example.com' });
  });

  it('says the same thing about a wrong password as about an account that does not exist', () => {
    const wrongPassword = describeSignInAttempt(attempted({ statusCode: 401 }));
    const noSuchAccount = describeSignInAttempt(
      attempted({ statusCode: 401, identifier: 'nobody@example.com' }),
    );

    expect(wrongPassword?.data).toMatchObject({ reason: 'those details weren’t accepted.' });
    expect(noSuchAccount?.data).toMatchObject({ reason: 'those details weren’t accepted.' });
  });

  it('says nothing about a request that was not a sign-in', () => {
    expect(describeSignInAttempt(attempted({ path: '/sign-out', statusCode: 401 }))).toBeNull();
  });

  it('says nothing about a sign-in that neither succeeded nor was refused', () => {
    expect(describeSignInAttempt(attempted({ statusCode: null, account: null }))).toBeNull();
  });

  it('reports a sign-in through any of the ways in, not only by password', () => {
    const occurrence = describeSignInAttempt(
      attempted({ path: '/sign-in/passkey', account: { id: 'account-1', name: 'Ada' } }),
    );

    expect(occurrence?.event).toBe('auth.succeeded');
  });

  it('names an unknown device rather than printing nothing', () => {
    const occurrence = describeSignInAttempt(
      attempted({
        statusCode: 401,
        userAgent: null,
        device: { deviceId: null, identity: identifyDevice({ userAgent: null }) },
      }),
    );

    expect(occurrence?.data).toMatchObject({ deviceLabel: 'Unknown device' });
  });

  it('carries no address where the server could not work one out', () => {
    const occurrence = describeSignInAttempt(attempted({ statusCode: 401, address: null }));

    expect(occurrence?.data).toMatchObject({ address: null });
  });

  it('still reports a refusal that gave no identifier at all', () => {
    const occurrence = describeSignInAttempt(attempted({ statusCode: 401, identifier: null }));

    expect(occurrence?.event).toBe('auth.failed');
    expect(occurrence?.data).toMatchObject({ identifier: 'someone who didn’t give an address' });
  });
});
