import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasskeyMaking } from './theNativeModule';

const { makeAPasskey } = vi.hoisted(() => ({
  makeAPasskey: vi.fn<(window: Buffer, making: PasskeyMaking) => Promise<object>>(),
}));

vi.mock('@ValenceDesktop/main/theNativeModule', () => ({
  theNativeModule: () => ({ makeAPasskey }),
}));

const { haveWindowsMakeAPasskey } = await import('./haveWindowsMakeAPasskey');

const WINDOW = Buffer.alloc(8);

const SERVER = 'https://valence.example';

const OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rp: { name: 'Valence', id: 'valence.example' },
  user: { id: Buffer.from('user').toString('base64url'), name: 'Dan', displayName: 'Dan' },
  pubKeyCredParams: [
    { alg: -7, type: 'public-key' as const },
    { alg: -257, type: 'public-key' as const },
  ],
  excludeCredentials: [{ id: 'b2xk', type: 'public-key' as const }],
  authenticatorSelection: {
    residentKey: 'preferred' as const,
    userVerification: 'preferred' as const,
  },
  attestation: 'none' as const,
};

beforeEach(() => {
  makeAPasskey.mockReset();
});

describe('haveWindowsMakeAPasskey', () => {
  it('asks Windows to make one for this account, as the server described it', async () => {
    makeAPasskey.mockResolvedValue({
      credentialId: Buffer.from('key'),
      attestationObject: Buffer.from('made'),
      transports: ['internal', 'hybrid'],
    });

    const reply = await haveWindowsMakeAPasskey(WINDOW, OPTIONS, SERVER);
    const asked = makeAPasskey.mock.calls[0]?.[1];

    expect(asked).toMatchObject({
      rpId: 'valence.example',
      rpName: 'Valence',
      userName: 'Dan',
      algorithms: [-7, -257],
      residentKey: 'preferred',
      userVerification: 'preferred',
      attestation: 'none',
      attachment: '',
    });
    expect(asked?.userId.toString()).toBe('user');
    expect(asked?.exclude.map((id) => id.toString())).toEqual(['old']);
    expect(JSON.parse(asked?.clientDataJson ?? '')).toMatchObject({
      type: 'webauthn.create',
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
          attestationObject: Buffer.from('made').toString('base64url'),
          transports: ['internal', 'hybrid'],
        },
      },
    });
  });

  it('asks for a resident key where the server requires one the old way', async () => {
    makeAPasskey.mockResolvedValue({
      credentialId: Buffer.from('key'),
      attestationObject: Buffer.from('made'),
      transports: [],
    });

    await haveWindowsMakeAPasskey(
      WINDOW,
      { ...OPTIONS, authenticatorSelection: { requireResidentKey: true } },
      SERVER,
    );

    expect(makeAPasskey.mock.calls[0]?.[1].residentKey).toBe('required');
  });

  it('says a passkey this device already holds is already here', async () => {
    makeAPasskey.mockRejectedValue(new Error('InvalidStateError'));

    await expect(haveWindowsMakeAPasskey(WINDOW, OPTIONS, SERVER)).resolves.toEqual({
      kind: 'failed',
      reason: 'This device already has a passkey for this account.',
    });
  });
});
