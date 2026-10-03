import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasskeyAsk } from './theNativeModule';

const { askForAPasskey, isBuilt } = vi.hoisted(() => ({
  askForAPasskey: vi.fn<(window: Buffer, ask: PasskeyAsk) => Promise<object>>(),
  isBuilt: { now: true },
}));

vi.mock('@ValenceDesktop/main/theNativeModule', () => ({
  theNativeModule: () => (isBuilt.now ? { askForAPasskey } : {}),
}));

const { askWindowsForAPasskey } = await import('./askWindowsForAPasskey');

const WINDOW = Buffer.alloc(8);

const SERVER = 'https://valence.example';

const OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rpId: 'valence.example',
  allowCredentials: [{ id: 'a2V5', type: 'public-key' as const }],
  userVerification: 'required' as const,
  timeout: 60_000,
};

beforeEach(() => {
  askForAPasskey.mockReset();
  isBuilt.now = true;
});

describe('askWindowsForAPasskey', () => {
  it('asks Windows over the window, for the server, as its own page would', async () => {
    askForAPasskey.mockResolvedValue({
      credentialId: Buffer.from('key'),
      authenticatorData: Buffer.from('data'),
      signature: Buffer.from('signed'),
      userHandle: Buffer.from('user'),
    });

    const reply = await askWindowsForAPasskey(WINDOW, OPTIONS, SERVER);
    const asked = askForAPasskey.mock.calls[0]?.[1];

    expect(askForAPasskey.mock.calls[0]?.[0]).toBe(WINDOW);
    expect(asked).toMatchObject({
      rpId: 'valence.example',
      userVerification: 'required',
      timeoutMs: 60_000,
    });
    expect(asked?.allow.map((id) => id.toString())).toEqual(['key']);
    expect(JSON.parse(asked?.clientDataJson ?? '')).toMatchObject({
      type: 'webauthn.get',
      challenge: 'Y2hhbGxlbmdl',
      origin: SERVER,
    });
    expect(reply).toEqual({
      kind: 'done',
      done: {
        id: 'a2V5',
        rawId: 'a2V5',
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(asked?.clientDataJson ?? '').toString('base64url'),
          authenticatorData: Buffer.from('data').toString('base64url'),
          signature: Buffer.from('signed').toString('base64url'),
          userHandle: Buffer.from('user').toString('base64url'),
        },
      },
    });
  });

  it('names the server by its own host where the options do not', async () => {
    askForAPasskey.mockResolvedValue({
      credentialId: Buffer.from('key'),
      authenticatorData: Buffer.from('data'),
      signature: Buffer.from('signed'),
      userHandle: null,
    });

    const reply = await askWindowsForAPasskey(WINDOW, { challenge: 'abc' }, SERVER);

    expect(askForAPasskey.mock.calls[0]?.[1]).toMatchObject({
      rpId: 'valence.example',
      allow: [],
      userVerification: 'preferred',
    });
    expect(reply.kind === 'done' ? reply.done.response.userHandle : 'none').toBeUndefined();
  });

  it('reads a closed prompt as a cancellation', async () => {
    askForAPasskey.mockRejectedValue(new Error('NotAllowedError'));

    await expect(askWindowsForAPasskey(WINDOW, OPTIONS, SERVER)).resolves.toEqual({
      kind: 'cancelled',
    });
  });

  it('fails on an answer it cannot read', async () => {
    askForAPasskey.mockResolvedValue({ credentialId: 'not bytes' });

    await expect(askWindowsForAPasskey(WINDOW, OPTIONS, SERVER)).resolves.toMatchObject({
      kind: 'failed',
    });
  });

  it('says so where this build has no way to ask Windows', async () => {
    isBuilt.now = false;

    await expect(askWindowsForAPasskey(WINDOW, OPTIONS, SERVER)).resolves.toEqual({
      kind: 'failed',
      reason: 'This build can’t use Windows passkeys.',
    });
  });
});
