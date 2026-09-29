import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Handler = (event: { sender: object }, ...said: JsonValue[]) => Promise<object>;

const {
  handle,
  on,
  openExternal,
  fromWebContents,
  askWindowsForAPasskey,
  haveWindowsMakeAPasskey,
  signInOnAPage,
} = vi.hoisted(() => ({
  handle: vi.fn<(channel: string, handler: Handler) => void>(),
  on: vi.fn<(channel: string, listener: () => void) => void>(),
  openExternal: vi.fn<(url: string) => Promise<void>>(),
  fromWebContents: vi.fn<() => { getNativeWindowHandle: () => Buffer } | null>(),
  askWindowsForAPasskey: vi.fn(() => Promise.resolve({ kind: 'cancelled' })),
  haveWindowsMakeAPasskey: vi.fn(() => Promise.resolve({ kind: 'cancelled' })),
  signInOnAPage: vi.fn(() => Promise.resolve({ kind: 'cancelled' })),
}));

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents },
  ipcMain: { handle, on },
  shell: { openExternal },
}));

vi.mock('@ValenceDesktop/main/askWindowsForAPasskey', () => ({ askWindowsForAPasskey }));

vi.mock('@ValenceDesktop/main/haveWindowsMakeAPasskey', () => ({ haveWindowsMakeAPasskey }));

vi.mock('@ValenceDesktop/main/signInOnAPage', () => ({ signInOnAPage }));

vi.mock('@ValenceDesktop/main/theServerAddress', () => ({
  theServerAddress: () => 'https://valence.example',
}));

const { answerAboutPasskeys } = await import('./answerAboutPasskeys');

const HANDLE = Buffer.alloc(8);

const EVENT = { sender: {} };

/**
 * The handler this process registered for a channel.
 *
 * @param channel - Which channel.
 * @returns Its handler.
 */
const handlerFor = (channel: string): Handler => {
  const found = handle.mock.calls.find(([registered]) => registered === channel)?.[1];

  if (found === undefined) {
    throw new Error(`Nothing answers ${channel}.`);
  }

  return found;
};

beforeEach(() => {
  handle.mockReset();
  on.mockReset();
  openExternal.mockReset().mockResolvedValue();
  fromWebContents.mockReset().mockReturnValue({ getNativeWindowHandle: () => HANDLE });
  askWindowsForAPasskey.mockClear();
  haveWindowsMakeAPasskey.mockClear();
  signInOnAPage.mockClear();
  answerAboutPasskeys();
});

describe('answerAboutPasskeys', () => {
  it('asks Windows over the window that asked, for the server it watches', async () => {
    await handlerFor('valence.passkeys.ask')(EVENT, { challenge: 'abc' });

    expect(askWindowsForAPasskey).toHaveBeenCalledWith(
      HANDLE,
      { challenge: 'abc' },
      'https://valence.example',
    );
  });

  it('has Windows make one the same way', async () => {
    const options = {
      challenge: 'abc',
      rp: { name: 'Valence' },
      user: { id: 'dXNlcg', name: 'Dan', displayName: 'Dan' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    };

    await handlerFor('valence.passkeys.make')(EVENT, options);

    expect(haveWindowsMakeAPasskey).toHaveBeenCalledWith(
      HANDLE,
      options,
      'https://valence.example',
    );
  });

  it('refuses options it cannot read, without asking anybody', async () => {
    await expect(handlerFor('valence.passkeys.ask')(EVENT, { rpId: 'x' })).resolves.toMatchObject({
      kind: 'failed',
    });
    expect(askWindowsForAPasskey).not.toHaveBeenCalled();
  });

  it('says so where the window that asked has gone', async () => {
    fromWebContents.mockReturnValue(null);

    await expect(
      handlerFor('valence.passkeys.ask')(EVENT, { challenge: 'abc' }),
    ).resolves.toMatchObject({ kind: 'failed' });
  });

  it('signs in on a page only for a challenge that is a SHA-256', async () => {
    await handlerFor('valence.passkeys.sign-in-on-a-page')(EVENT, 'a'.repeat(64), 'profile-1');
    await handlerFor('valence.passkeys.sign-in-on-a-page')(EVENT, 'plain', null);

    expect(signInOnAPage).toHaveBeenCalledTimes(1);
    expect(signInOnAPage).toHaveBeenCalledWith(expect.anything(), 'a'.repeat(64), 'profile-1');
  });

  it('opens the account’s security panel in the browser to add one', () => {
    const listener = on.mock.calls.find(
      ([channel]) => channel === 'valence.passkeys.add-one-in-the-browser',
    )?.[1];

    listener?.();

    expect(openExternal).toHaveBeenCalledWith('https://valence.example/?account=security');
  });
});
