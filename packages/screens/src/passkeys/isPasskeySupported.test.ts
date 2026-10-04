import { afterEach, describe, expect, it, vi } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import type { Passkeys } from '@ValenceClient/platform/Platform.types';
import { isPasskeySupported, describePasskeyUnavailability } from './isPasskeySupported';

const setContext = (options: { secure: boolean; hasCredential: boolean }) => {
  vi.stubGlobal('window', {
    isSecureContext: options.secure,
    PublicKeyCredential: options.hasCredential ? function PublicKeyCredential() {} : undefined,
  });
};

const passkeysAre = (passkeys: Passkeys) => {
  installPlatform({ ...platformInUse(), passkeys: () => passkeys });
};

afterEach(() => {
  vi.unstubAllGlobals();
  passkeysAre({ kind: 'in-the-page' });
});

describe('isPasskeySupported', () => {
  it('is supported in a secure context with webauthn', () => {
    setContext({ secure: true, hasCredential: true });

    expect(isPasskeySupported()).toBe(true);
  });

  it('is unsupported over plain http', () => {
    setContext({ secure: false, hasCredential: true });

    expect(isPasskeySupported()).toBe(false);
  });

  it('is unsupported when the browser lacks webauthn', () => {
    setContext({ secure: true, hasCredential: false });

    expect(isPasskeySupported()).toBe(false);
  });
});

describe('describePasskeyUnavailability', () => {
  it('says nothing when passkeys work', () => {
    setContext({ secure: true, hasCredential: true });

    expect(describePasskeyUnavailability()).toBeNull();
  });

  it('explains the secure context requirement, naming https and localhost', () => {
    setContext({ secure: false, hasCredential: true });

    expect(describePasskeyUnavailability()).toMatch(/HTTPS.*localhost/);
  });

  it('explains an unsupported browser', () => {
    setContext({ secure: true, hasCredential: false });

    expect(describePasskeyUnavailability()).toMatch(/doesn’t support passkeys/);
  });
});

describe('a client whose pages cannot ask', () => {
  it('offers passkeys where its system asks, whatever the page could do', () => {
    setContext({ secure: false, hasCredential: false });
    passkeysAre({ kind: 'through-the-system', ask: vi.fn(), make: vi.fn() });

    expect(isPasskeySupported()).toBe(true);
    expect(describePasskeyUnavailability()).toBeNull();
  });

  it('offers signing in on a page elsewhere, and says passkeys are added there', () => {
    setContext({ secure: true, hasCredential: true });
    passkeysAre({ kind: 'through-a-sign-in-page', signIn: vi.fn(), addOne: vi.fn() });

    expect(isPasskeySupported()).toBe(true);
    expect(describePasskeyUnavailability()).toMatch(/in your web browser/);
  });

  it('offers nothing where it has none, and says why', () => {
    setContext({ secure: true, hasCredential: true });
    passkeysAre({ kind: 'none', why: 'Passkeys need Valence reached over HTTPS.' });

    expect(isPasskeySupported()).toBe(false);
    expect(describePasskeyUnavailability()).toBe('Passkeys need Valence reached over HTTPS.');
  });
});
