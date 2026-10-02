import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readCurrentProfile, writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import {
  answerDeviceRequest,
  askWhetherTheDeviceMayIn,
  readDeviceRequest,
  startDeviceGrant,
  authenticateWithPasskey,
  confirmItIsYou,
  isThisSessionConfirmed,
  deletePasskey,
  disableTwoFactor,
  enableTwoFactor,
  fetchSession,
  listPasskeys,
  registerPasskey,
  renamePasskey,
  signInWithUsernameOrEmail,
  signOut,
  verifyBackupCode,
  verifyTotp,
} from './auth';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const AN_ACCOUNT = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Operator',
  email: 'operator@valence.test',
  emailVerified: true,
  image: null,
  role: 'admin',
  twoFactorEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const A_PASSKEY = {
  id: 'passkey-1',
  name: 'Laptop',
  deviceType: 'singleDevice',
  backedUp: false,
  createdAt: '2026-08-10T00:00:00.000Z',
  publicKey: 'x',
  userId: AN_ACCOUNT.id,
  credentialID: 'x',
  counter: 0,
  transports: 'internal',
};

const said = (body: object | null, status = 200) =>
  new Response(body === null ? 'null' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/**
 * The path of whatever was asked for, since the client asks for an absolute address and the test
 * cares which endpoint it was.
 */
const asked = (at = 0): string =>
  new URL(String(fetchMock.mock.calls[at]?.[0] ?? '/'), 'http://localhost:3000').pathname;

/**
 * What was sent with a request, read back as JSON.
 */
const sentWith = (at: number): object => {
  const body = fetchMock.mock.calls[at]?.[1]?.body;

  return typeof body === 'string' ? z.record(z.string(), z.json()).parse(JSON.parse(body)) : {};
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('signInWithUsernameOrEmail', () => {
  it('signs in through better-auth, for a server that does not show who lives here', async () => {
    fetchMock.mockResolvedValue(said({ user: AN_ACCOUNT }));

    await expect(
      signInWithUsernameOrEmail('operator@valence.test', 'a-password'),
    ).resolves.toStrictEqual({
      kind: 'signedIn',
    });

    expect(asked()).toBe('/api/auth/sign-in/email');
  });

  it('signs in by username where what was typed has no @ in it', async () => {
    fetchMock.mockResolvedValue(said({ user: AN_ACCOUNT }));

    await expect(signInWithUsernameOrEmail(' Operator ', 'a-password')).resolves.toStrictEqual({
      kind: 'signedIn',
    });

    expect(asked()).toBe('/api/auth/sign-in/username');
    expect(sentWith(0)).toMatchObject({ username: 'Operator' });
  });

  it('asks for a code where the account has a second factor', async () => {
    fetchMock.mockResolvedValue(said({ twoFactorRedirect: true }));

    await expect(
      signInWithUsernameOrEmail('operator@valence.test', 'a-password'),
    ).resolves.toStrictEqual({
      kind: 'needsCode',
    });
  });

  it('says so where the address and password were not accepted', async () => {
    fetchMock.mockResolvedValue(said({ message: 'Invalid credentials' }, 401));

    const outcome = await signInWithUsernameOrEmail('operator@valence.test', 'wrong');

    expect(outcome.kind).toBe('refused');
  });

  it('does not throw where Valence could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const outcome = await signInWithUsernameOrEmail('operator@valence.test', 'a-password');

    expect(outcome).toStrictEqual({ kind: 'refused', reason: 'Valence could not be reached.' });
  });
});

describe('fetchSession', () => {
  it('reads who is signed in, through better-auth rather than a hand-written request', async () => {
    fetchMock.mockResolvedValue(said({ user: AN_ACCOUNT, session: { id: 'session-1' } }));

    await expect(fetchSession()).resolves.toMatchObject({
      id: AN_ACCOUNT.id,
      name: 'Operator',
      role: 'admin',
      twoFactorEnabled: true,
    });

    expect(asked()).toBe('/api/auth/get-session');
  });

  it('carries the username, and never the placeholder an account without an address holds', async () => {
    fetchMock.mockResolvedValue(
      said({
        user: {
          ...AN_ACCOUNT,
          email: `${AN_ACCOUNT.id}@no-email.invalid`,
          username: 'operator',
          displayUsername: 'Operator',
        },
        session: { id: 'session-1' },
      }),
    );

    await expect(fetchSession()).resolves.toMatchObject({ email: null, username: 'Operator' });
  });

  it('answers with nobody where nobody is signed in', async () => {
    fetchMock.mockResolvedValue(said(null));

    await expect(fetchSession()).resolves.toBeNull();
  });

  it('refuses to answer at all where the server could not be reached', async () => {
    fetchMock.mockResolvedValue(said({}, 500));

    await expect(fetchSession()).rejects.toThrow(/500/);
  });
});

describe('signOut', () => {
  it('ends the session where it was issued', async () => {
    fetchMock.mockResolvedValue(said({ success: true }));

    await expect(signOut()).resolves.toBe(true);

    expect(asked()).toBe('/api/auth/sign-out');
  });

  it('says what it is sending and sends it, since a body-less post is refused outright', async () => {
    fetchMock.mockResolvedValue(said({ success: true }));

    await signOut();

    const sent = fetchMock.mock.calls[0]?.[1];

    expect(new Headers(sent?.headers).get('content-type')).toBe('application/json');
    expect(sent?.body).toBe('{}');
  });

  it('forgets which face this device was watching as', async () => {
    writeCurrentProfile('somebody');
    fetchMock.mockResolvedValue(said({ success: true }));

    await signOut();

    expect(readCurrentProfile()).toBeNull();
  });

  it('says so when the server would not end it', async () => {
    fetchMock.mockResolvedValue(said({}, 500));

    await expect(signOut()).resolves.toBe(false);
  });

  it('believes the server rather than a second opinion about the same answer', async () => {
    fetchMock.mockResolvedValue(said({ success: true }));

    await expect(signOut()).resolves.toBe(true);
  });

  it('forgets the face even where the server refused, since somebody still walked away', async () => {
    writeCurrentProfile('somebody');
    fetchMock.mockResolvedValue(said({}, 500));

    await signOut();

    expect(readCurrentProfile()).toBeNull();
  });
});

describe('passkeys', () => {
  it('lists them with the times written as text rather than as dates', async () => {
    fetchMock.mockResolvedValue(said([A_PASSKEY]));

    await expect(listPasskeys()).resolves.toEqual([
      {
        id: 'passkey-1',
        name: 'Laptop',
        deviceType: 'singleDevice',
        backedUp: false,
        createdAt: '2026-08-10T00:00:00.000Z',
      },
    ]);

    expect(asked()).toBe('/api/auth/passkey/list-user-passkeys');
  });

  it('refuses to answer with a half-list where the server refused', async () => {
    fetchMock.mockResolvedValue(said({}, 500));

    await expect(listPasskeys()).rejects.toThrow(/500/);
  });

  it('removes one, and renames one', async () => {
    fetchMock.mockResolvedValue(said({ status: true }));

    await expect(deletePasskey('passkey-1')).resolves.toBe(true);
    expect(asked()).toBe('/api/auth/passkey/delete-passkey');

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(said({ status: true }));

    await expect(renamePasskey('passkey-1', 'Phone')).resolves.toBe(true);
    expect(asked()).toBe('/api/auth/passkey/update-passkey');
  });

  it('says so when the server would not remove or rename one', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(said({}, 500)));

    await expect(deletePasskey('passkey-1')).resolves.toBe(false);
    await expect(renamePasskey('passkey-1', 'Phone')).resolves.toBe(false);
  });

  it('takes a refused registration for an answer rather than throwing', async () => {
    fetchMock.mockResolvedValue(said({}, 500));

    await expect(registerPasskey('Laptop')).resolves.toMatchObject({ kind: 'failed' });
  });

  it('takes a refused sign-in for an answer rather than throwing', async () => {
    fetchMock.mockResolvedValue(said({}, 500));

    await expect(authenticateWithPasskey()).resolves.toMatchObject({ kind: 'failed' });
  });

  it('says the server could not be reached rather than throwing at the caller', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(authenticateWithPasskey()).resolves.toMatchObject({ kind: 'failed' });
    await expect(registerPasskey('Laptop')).resolves.toMatchObject({ kind: 'failed' });
  });

  it('says nothing at all when the ceremony was called off', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(said({ challenge: 'abc', rpId: 'localhost' })),
    );

    await expect(authenticateWithPasskey()).resolves.toEqual({ kind: 'cancelled' });
  });
});

const REQUEST_OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rpId: 'valence.test',
  userVerification: 'preferred',
};

const CREATION_OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rp: { name: 'Valence', id: 'valence.test' },
  user: { id: 'dXNlcg', name: 'Operator', displayName: 'Operator' },
  pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
};

const AN_ASSERTION = {
  id: 'key',
  rawId: 'key',
  type: 'public-key' as const,
  response: { clientDataJSON: 'e30', authenticatorData: 'AA', signature: 'AA' },
};

const AN_ATTESTATION = {
  id: 'key',
  rawId: 'key',
  type: 'public-key' as const,
  response: { clientDataJSON: 'e30', attestationObject: 'AA', transports: ['internal'] },
};

describe('passkeys through the system', () => {
  it('signs in with what the host asked its system for', async () => {
    const ask = vi.fn(() => Promise.resolve(AN_ASSERTION));

    installPlatform(
      aFakePlatform({
        passkeys: () => ({ kind: 'through-the-system', ask, make: vi.fn() }),
      }),
    );
    fetchMock
      .mockResolvedValueOnce(said(REQUEST_OPTIONS))
      .mockResolvedValueOnce(said({ session: {}, user: AN_ACCOUNT }));

    await expect(authenticateWithPasskey()).resolves.toEqual({ kind: 'signedIn' });

    expect(ask).toHaveBeenCalledWith(REQUEST_OPTIONS);
    expect(asked(0)).toBe('/api/auth/passkey/generate-authenticate-options');
    expect(asked(1)).toBe('/api/auth/passkey/verify-authentication');
    expect(sentWith(1)).toEqual({
      response: AN_ASSERTION,
    });
  });

  it('says nothing where somebody cancelled the system prompt', async () => {
    installPlatform(
      aFakePlatform({
        passkeys: () => ({
          kind: 'through-the-system',
          ask: () => Promise.resolve(null),
          make: vi.fn(),
        }),
      }),
    );
    fetchMock.mockResolvedValueOnce(said(REQUEST_OPTIONS));

    await expect(authenticateWithPasskey()).resolves.toEqual({ kind: 'cancelled' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('passes on what the system said went wrong', async () => {
    installPlatform(
      aFakePlatform({
        passkeys: () => ({
          kind: 'through-the-system',
          ask: () => Promise.reject(new Error('Windows Hello is not set up.')),
          make: vi.fn(),
        }),
      }),
    );
    fetchMock.mockResolvedValueOnce(said(REQUEST_OPTIONS));

    await expect(authenticateWithPasskey()).resolves.toEqual({
      kind: 'failed',
      reason: 'Windows Hello is not set up.',
    });
  });

  it('adds what the host had its system make, under the name given', async () => {
    const make = vi.fn(() => Promise.resolve(AN_ATTESTATION));

    installPlatform(
      aFakePlatform({ passkeys: () => ({ kind: 'through-the-system', ask: vi.fn(), make }) }),
    );
    fetchMock
      .mockResolvedValueOnce(said({ isConfirmed: true }))
      .mockResolvedValueOnce(said(CREATION_OPTIONS))
      .mockResolvedValueOnce(said(A_PASSKEY));

    await expect(registerPasskey('Laptop')).resolves.toEqual({ kind: 'registered' });

    expect(make).toHaveBeenCalledWith(CREATION_OPTIONS);
    expect(asked(0)).toBe('/api/auth/confirmation');
    expect(asked(1)).toBe('/api/auth/passkey/generate-register-options');
    expect(asked(2)).toBe('/api/auth/passkey/verify-registration');
    expect(sentWith(2)).toEqual({
      response: AN_ATTESTATION,
      name: 'Laptop',
    });
  });

  it('refuses options the server did not send whole', async () => {
    const ask = vi.fn();

    installPlatform(
      aFakePlatform({ passkeys: () => ({ kind: 'through-the-system', ask, make: vi.fn() }) }),
    );
    fetchMock.mockResolvedValueOnce(said({ rpId: 'valence.test' }));

    await expect(authenticateWithPasskey()).resolves.toMatchObject({ kind: 'failed' });
    expect(ask).not.toHaveBeenCalled();
  });
});

describe('confirming it is you', () => {
  it('asks for confirmation before any passkey is made, for a session signed in long ago', async () => {
    const make = vi.fn();

    installPlatform(
      aFakePlatform({ passkeys: () => ({ kind: 'through-the-system', ask: vi.fn(), make }) }),
    );
    fetchMock.mockResolvedValueOnce(said({ isConfirmed: false }));

    await expect(registerPasskey('Laptop')).resolves.toEqual({ kind: 'unconfirmed' });
    expect(make).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks the same of a browser, before its own ceremony', async () => {
    fetchMock.mockResolvedValueOnce(said({ isConfirmed: false }));

    await expect(registerPasskey('Laptop')).resolves.toEqual({ kind: 'unconfirmed' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('takes a server that cannot say as one that does not ask', async () => {
    fetchMock.mockResolvedValueOnce(said({ error: 'Not found' }, 404));

    await expect(isThisSessionConfirmed()).resolves.toBe(true);
  });

  it('confirms with the password', async () => {
    fetchMock.mockResolvedValueOnce(said({ isConfirmed: true }));

    await expect(confirmItIsYou('a-password')).resolves.toEqual({ kind: 'confirmed' });
    expect(asked()).toBe('/api/auth/confirm-it-is-you');
    expect(sentWith(0)).toEqual({ password: 'a-password' });
  });

  it('says why it did not', async () => {
    fetchMock
      .mockResolvedValueOnce(said({ message: 'That is not your password.' }, 400))
      .mockResolvedValueOnce(said({ message: 'Too many requests.' }, 429));

    await expect(confirmItIsYou('wrong')).resolves.toEqual({
      kind: 'failed',
      reason: 'That is not your password.',
    });
    await expect(confirmItIsYou('wrong')).resolves.toEqual({
      kind: 'failed',
      reason: 'Too many tries. Wait a minute and try again.',
    });
  });
});

describe('passkeys through a sign-in page', () => {
  it('signs in on the page, for the face already chosen', async () => {
    const signIn = vi.fn(() => Promise.resolve('in' as const));

    installPlatform(
      aFakePlatform({
        passkeys: () => ({ kind: 'through-a-sign-in-page', signIn, addOne: vi.fn() }),
      }),
    );

    await expect(authenticateWithPasskey('profile-1')).resolves.toEqual({ kind: 'signedIn' });
    expect(signIn).toHaveBeenCalledWith('profile-1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tells a cancelled page from a failed one', async () => {
    installPlatform(
      aFakePlatform({
        passkeys: () => ({
          kind: 'through-a-sign-in-page',
          signIn: () => Promise.resolve('cancelled' as const),
          addOne: vi.fn(),
        }),
      }),
    );

    await expect(authenticateWithPasskey()).resolves.toEqual({ kind: 'cancelled' });
  });

  it('does not try to add one here', async () => {
    installPlatform(
      aFakePlatform({
        passkeys: () => ({ kind: 'through-a-sign-in-page', signIn: vi.fn(), addOne: vi.fn() }),
      }),
    );

    await expect(registerPasskey('Laptop')).resolves.toMatchObject({ kind: 'failed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('passkeys where there are none', () => {
  it('says why', async () => {
    installPlatform(aFakePlatform({ passkeys: () => ({ kind: 'none', why: 'Not here.' }) }));

    await expect(authenticateWithPasskey()).resolves.toEqual({
      kind: 'failed',
      reason: 'Not here.',
    });
    await expect(registerPasskey('Laptop')).resolves.toEqual({
      kind: 'failed',
      reason: 'Not here.',
    });
  });
});

describe('two-factor', () => {
  it('starts enrolment, and hands back the secret and the backup codes', async () => {
    fetchMock.mockResolvedValue(
      said({ method: 'totp', totpURI: 'otpauth://totp/Valence', backupCodes: ['aaaa-1111'] }),
    );

    await expect(enableTwoFactor('a-long-enough-password')).resolves.toEqual({
      totpURI: 'otpauth://totp/Valence',
      backupCodes: ['aaaa-1111'],
    });

    expect(asked()).toBe('/api/auth/two-factor/enable');
  });

  it('hands back nothing where the server enrolled a code by mail, which Valence does not offer', async () => {
    fetchMock.mockResolvedValue(said({ method: 'otp' }));

    await expect(enableTwoFactor('a-long-enough-password')).resolves.toBeNull();
  });

  it('hands back nothing where the password was wrong', async () => {
    fetchMock.mockResolvedValue(said({}, 401));

    await expect(enableTwoFactor('wrong')).resolves.toBeNull();
  });

  it('checks a code from an authenticator, and one of the backup codes', async () => {
    fetchMock.mockResolvedValue(said({ status: true }));

    await expect(verifyTotp('123456')).resolves.toBe(true);
    expect(asked()).toBe('/api/auth/two-factor/verify-totp');

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(said({ status: true }));

    await expect(verifyBackupCode('aaaa-1111')).resolves.toBe(true);
    expect(asked()).toBe('/api/auth/two-factor/verify-backup-code');
  });

  it('says so when a code was not accepted', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(said({}, 401)));

    await expect(verifyTotp('123456')).resolves.toBe(false);
    await expect(verifyBackupCode('aaaa-1111')).resolves.toBe(false);
  });

  it('turns it off, and says so when the password was wrong', async () => {
    fetchMock.mockResolvedValue(said({ status: true }));

    await expect(disableTwoFactor('a-long-enough-password')).resolves.toBe(true);
    expect(asked()).toBe('/api/auth/two-factor/disable');

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(said({}, 401));

    await expect(disableTwoFactor('wrong')).resolves.toBe(false);
  });
});

describe('askWhetherTheDeviceMayIn', () => {
  it('hands back the session token once a phone has let the television in', async () => {
    fetchMock.mockResolvedValue(
      said({ access_token: 'a-session-token', token_type: 'Bearer', expires_in: 60, scope: '' }),
    );

    expect(await askWhetherTheDeviceMayIn('the-long-secret-one')).toEqual({
      kind: 'signedIn',
      token: 'a-session-token',
    });
    expect(asked()).toBe('/api/auth/device/token');
  });

  it('keeps waiting while nobody has answered on the phone yet', async () => {
    fetchMock.mockResolvedValue(said({ error: 'authorization_pending' }, 400));

    expect(await askWhetherTheDeviceMayIn('the-long-secret-one')).toEqual({ kind: 'waiting' });
  });

  it('asks less often when the server says it is being asked too often', async () => {
    fetchMock.mockResolvedValue(said({ error: 'slow_down' }, 400));

    expect(await askWhetherTheDeviceMayIn('the-long-secret-one')).toEqual({ kind: 'slowDown' });
  });

  it('says so when the phone said no', async () => {
    fetchMock.mockResolvedValue(said({ error: 'access_denied' }, 400));

    expect(await askWhetherTheDeviceMayIn('the-long-secret-one')).toEqual({ kind: 'refused' });
  });
});

describe('the television’s other half', () => {
  it('starts a grant and hands back the codes to show', async () => {
    fetchMock.mockResolvedValue(
      said({
        device_code: 'the-long-secret-one',
        user_code: 'ABCD-EFGH',
        verification_uri: 'http://valence.test/device',
        verification_uri_complete: 'http://valence.test/device?user_code=ABCD-EFGH',
        interval: 5,
        expires_in: 900,
      }),
    );

    await expect(startDeviceGrant()).resolves.toEqual({
      deviceCode: 'the-long-secret-one',
      userCode: 'ABCD-EFGH',
      verificationUri: 'http://valence.test/device',
      verificationUriComplete: 'http://valence.test/device?user_code=ABCD-EFGH',
      intervalSeconds: 5,
      expiresInSeconds: 900,
    });
    expect(asked()).toBe('/api/auth/device/code');
  });

  it('has no grant where the server would not start one', async () => {
    fetchMock.mockResolvedValue(said({ error: 'invalid_client' }, 400));

    await expect(startDeviceGrant()).resolves.toBeNull();
  });

  it('says a grant has run out, and that a code it does not know was not accepted', async () => {
    fetchMock.mockResolvedValueOnce(said({ error: 'expired_token' }, 400));
    fetchMock.mockResolvedValueOnce(said({ error: 'invalid_grant' }, 400));
    fetchMock.mockResolvedValueOnce(said({ error: 'something_else' }, 400));

    expect(await askWhetherTheDeviceMayIn('one')).toEqual({ kind: 'expired' });
    expect(await askWhetherTheDeviceMayIn('one')).toEqual({ kind: 'expired' });
    expect(await askWhetherTheDeviceMayIn('one')).toMatchObject({ kind: 'failed' });
  });

  it('reads what a typed code is asking for, and nothing for a code that means nothing', async () => {
    fetchMock.mockResolvedValueOnce(said({ user_code: 'ABCD-EFGH', status: 'pending' }));
    fetchMock.mockResolvedValueOnce(said({ user_code: 'ABCD-EFGH', status: 'lost' }));
    fetchMock.mockResolvedValueOnce(said({ error: 'invalid_request' }, 400));

    await expect(readDeviceRequest('ABCD-EFGH')).resolves.toEqual({
      userCode: 'ABCD-EFGH',
      status: 'pending',
    });
    expect(asked()).toBe('/api/auth/device');
    await expect(readDeviceRequest('ABCD-EFGH')).resolves.toBeNull();
    await expect(readDeviceRequest('ABCD-EFGH')).resolves.toBeNull();
  });

  it('lets a television in or turns it away, and says when that was not recorded', async () => {
    fetchMock.mockResolvedValueOnce(said({ success: true }));
    fetchMock.mockResolvedValueOnce(said({ success: true }));
    fetchMock.mockResolvedValueOnce(said({ error: 'invalid_request' }, 400));

    await expect(answerDeviceRequest('ABCD-EFGH', true)).resolves.toBe(true);
    expect(asked(0)).toBe('/api/auth/device/approve');
    await expect(answerDeviceRequest('ABCD-EFGH', false)).resolves.toBe(true);
    expect(asked(1)).toBe('/api/auth/device/deny');
    await expect(answerDeviceRequest('ABCD-EFGH', true)).resolves.toBe(false);
  });
});

describe('where Valence cannot be reached', () => {
  beforeEach(() => {
    fetchMock.mockRejectedValue(new Error('offline'));
  });

  it('does not throw at whoever was confirming it is them', async () => {
    await expect(confirmItIsYou('a-password')).resolves.toMatchObject({ kind: 'failed' });
  });

  it('does not throw at a television waiting to be let in', async () => {
    await expect(startDeviceGrant()).resolves.toBeNull();
    await expect(askWhetherTheDeviceMayIn('one')).resolves.toMatchObject({ kind: 'failed' });
  });

  it('does not throw at the phone letting a television in', async () => {
    await expect(readDeviceRequest('ABCD-EFGH')).resolves.toBeNull();
    await expect(answerDeviceRequest('ABCD-EFGH', true)).resolves.toBe(false);
  });
});
