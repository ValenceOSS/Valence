import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theDesktopsPasskeys } from './theDesktopsPasskeys';
import type { DesktopPasskeys } from '@ValenceDesktop/TheWindow.types';

const { swapTheHandBack } = vi.hoisted(() => ({
  swapTheHandBack: vi.fn<(code: string, secret: string) => Promise<boolean>>(),
}));

vi.mock('@ValenceClient/phone/swapTheHandBack', () => ({ swapTheHandBack }));

const ASSERTION = {
  id: 'key',
  rawId: 'key',
  type: 'public-key' as const,
  response: { clientDataJSON: 'e30', authenticatorData: 'AA', signature: 'AA' },
};

/**
 * A bridge from the window to this app's own process, answering however a test says.
 *
 * @param way - How this machine does passkeys.
 * @param overrides - Anything answered differently.
 * @returns The bridge.
 */
const aBridge = (
  way: DesktopPasskeys['way'],
  overrides: Partial<DesktopPasskeys> = {},
): DesktopPasskeys => ({
  way,
  ask: () => Promise.resolve({ kind: 'cancelled' }),
  make: () => Promise.resolve({ kind: 'cancelled' }),
  signInOnAPage: () => Promise.resolve({ kind: 'cancelled' }),
  addOneInTheBrowser: vi.fn(),
  ...overrides,
});

/**
 * Says which server this client watches.
 *
 * @param address - Where it is.
 */
const watching = (address: string) => {
  installPlatform(
    aFakePlatform({
      store: {
        read: (key) => (key === 'valence.server.address' ? address : null),
        write: () => {},
        forget: () => {},
      },
    }),
  );
};

beforeEach(() => {
  swapTheHandBack.mockReset();
  watching('https://valence.example');
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('theDesktopsPasskeys on Windows', () => {
  it('asks Windows, and hands back what it signed', async () => {
    const ask = vi.fn(() => Promise.resolve({ kind: 'done' as const, done: ASSERTION }));

    vi.stubGlobal('valence', { passkeys: aBridge('system', { ask }) });

    const passkeys = theDesktopsPasskeys();

    expect(passkeys.kind).toBe('through-the-system');
    await expect(
      passkeys.kind === 'through-the-system' ? passkeys.ask({ challenge: 'abc' }) : null,
    ).resolves.toEqual(ASSERTION);
  });

  it('answers nothing where somebody cancelled, and throws the reason where it failed', async () => {
    vi.stubGlobal('valence', {
      passkeys: aBridge('system', {
        make: () => Promise.resolve({ kind: 'failed', reason: 'Windows said no.' }),
      }),
    });

    const passkeys = theDesktopsPasskeys();

    if (passkeys.kind !== 'through-the-system') {
      throw new Error('Expected Windows to be asked.');
    }

    await expect(passkeys.ask({ challenge: 'abc' })).resolves.toBeNull();
    await expect(
      passkeys.make({
        challenge: 'abc',
        rp: { name: 'Valence' },
        user: { id: 'dXNlcg', name: 'Dan', displayName: 'Dan' },
        pubKeyCredParams: [],
      }),
    ).rejects.toThrow('Windows said no.');
  });
});

describe('theDesktopsPasskeys on a Mac or Linux', () => {
  it('signs in on the page with a challenge, and swaps the code for a session with its secret', async () => {
    const signInOnAPage = vi.fn<DesktopPasskeys['signInOnAPage']>((challenge) =>
      Promise.resolve({ kind: 'done', done: `code-for-${challenge}` }),
    );

    vi.stubGlobal('valence', { passkeys: aBridge('page', { signInOnAPage }) });
    swapTheHandBack.mockResolvedValue(true);

    const passkeys = theDesktopsPasskeys();

    if (passkeys.kind !== 'through-a-sign-in-page') {
      throw new Error('Expected a sign-in page.');
    }

    await expect(passkeys.signIn('profile-1')).resolves.toBe('in');

    const [challenge, profileId] = signInOnAPage.mock.calls[0] ?? [];
    const [code, secret] = swapTheHandBack.mock.calls[0] ?? [];

    expect(profileId).toBe('profile-1');
    expect(code).toBe(`code-for-${challenge ?? ''}`);
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(secret).not.toBe(challenge);
  });

  it('passes on a cancelled page, and a swap that did not go through', async () => {
    vi.stubGlobal('valence', { passkeys: aBridge('page') });

    const cancelled = theDesktopsPasskeys();

    await expect(
      cancelled.kind === 'through-a-sign-in-page' ? cancelled.signIn(null) : null,
    ).resolves.toBe('cancelled');

    vi.stubGlobal('valence', {
      passkeys: aBridge('page', {
        signInOnAPage: () => Promise.resolve({ kind: 'done', done: 'code' }),
      }),
    });
    swapTheHandBack.mockResolvedValue(false);

    const refused = theDesktopsPasskeys();

    await expect(
      refused.kind === 'through-a-sign-in-page' ? refused.signIn(null) : null,
    ).resolves.toBe('failed');
  });

  it('adds one in the browser', () => {
    const addOneInTheBrowser = vi.fn();

    vi.stubGlobal('valence', { passkeys: aBridge('page', { addOneInTheBrowser }) });

    const passkeys = theDesktopsPasskeys();

    const addOne = passkeys.kind === 'through-a-sign-in-page' ? passkeys.addOne : () => {};

    Reflect.apply(addOne, undefined, [{ type: 'click' }]);

    expect(addOneInTheBrowser).toHaveBeenCalledExactlyOnceWith();
  });
});

describe('theDesktopsPasskeys for a server over plain HTTP', () => {
  it('offers none, and says why', () => {
    watching('http://192.168.1.20:8420');
    vi.stubGlobal('valence', { passkeys: aBridge('system') });

    const passkeys = theDesktopsPasskeys();

    expect(passkeys.kind).toBe('none');
    expect(passkeys.kind === 'none' ? passkeys.why : '').toMatch(/HTTPS/);
  });

  it('still offers them for a server on this machine', () => {
    watching('http://localhost:8420');
    vi.stubGlobal('valence', { passkeys: aBridge('system') });

    expect(theDesktopsPasskeys().kind).toBe('through-the-system');
  });
});
