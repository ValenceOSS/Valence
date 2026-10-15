import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { Acting } from './Acting';
import { createProfileGate } from './createProfileGate';

const BASE = 'http://localhost:8420';

const AnswerSchema = z.object({ code: z.string().optional() });

const OWNER: Acting = {
  account: { id: 'account-1', name: 'Dan', email: 'dan@valence.local' },
  sessionId: 'session-1',
  isViaKey: false,
  profile: { id: 'parent', name: 'Parent', isOwner: true, mayRequest: true },
  mustChoose: false,
};

const KID: Acting = {
  ...OWNER,
  profile: { id: 'kid', name: 'Kid', isOwner: false, mayRequest: true },
};

const UNCHOSEN: Acting = { ...OWNER, profile: null, mustChoose: true };

const WITHOUT_PROFILES: Acting = { ...OWNER, profile: null, mustChoose: false };

/**
 * An application behind the gate that answers every request it lets through.
 *
 * @param acting - Who is acting for every request.
 * @returns The application, and what it asked who was acting.
 */
const behindTheGate = (acting: Acting | null) => {
  const readActing = vi
    .fn<(headers: Headers) => Promise<Acting | null>>()
    .mockResolvedValue(acting);
  const app = new Hono();

  app.use('/api/*', createProfileGate(readActing));
  app.all('/api/*', (context) => context.json({ reached: true }, 200));

  return { app, readActing };
};

/**
 * Asks the application behind the gate, and says what came back.
 *
 * @param acting - Who is acting.
 * @param method - How to ask.
 * @param path - Where to ask.
 * @returns The status, and the refusal's code where there was one.
 */
const ask = async (acting: Acting | null, method: string, path: string) => {
  const response = await behindTheGate(acting).app.request(`${BASE}${path}`, { method });
  const body = AnswerSchema.parse(await response.json());

  return { status: response.status, code: body.code ?? null };
};

describe('createProfileGate', () => {
  it('lets anybody through where nobody is signed in, for the session gate to decide', async () => {
    expect(await ask(null, 'GET', '/api/libraries')).toEqual({ status: 200, code: null });
  });

  it('does not ask who is acting for an open address', async () => {
    const { app, readActing } = behindTheGate(UNCHOSEN);

    const response = await app.request(`${BASE}/api/health`);

    expect(response.status).toBe(200);
    expect(readActing).not.toHaveBeenCalled();
  });

  it('turns a session that has not chosen away from everything but choosing', async () => {
    for (const [method, path] of [
      ['GET', '/api/libraries'],
      ['GET', '/api/media/film'],
      ['PATCH', '/api/profiles/kid'],
      ['POST', '/api/profiles'],
      ['GET', '/api/profiles/kid/libraries'],
    ] as const) {
      expect(await ask(UNCHOSEN, method, path)).toEqual({
        status: 403,
        code: 'error.profiles.chooseWhoIsWatching',
      });
    }
  });

  it('lets a session that has not chosen reach the picker and what draws it', async () => {
    for (const [method, path] of [
      ['GET', '/api/profiles'],
      ['POST', '/api/profiles/kid/choose'],
      ['DELETE', '/api/profiles/chosen'],
      ['GET', '/api/profiles/kid/avatar'],
      ['GET', '/api/account/permissions'],
      ['GET', '/api/account/onboarding'],
      ['GET', '/api/account/avatar'],
      ['GET', '/api/realtime'],
      ['GET', '/api/auth/get-session'],
      ['POST', '/api/auth/sign-out'],
    ] as const) {
      expect(await ask(UNCHOSEN, method, path)).toEqual({ status: 200, code: null });
    }
  });

  it('keeps a session that has not chosen to the method the picker uses', async () => {
    expect((await ask(UNCHOSEN, 'POST', '/api/account/onboarding')).status).toBe(403);
    expect(await ask(UNCHOSEN, 'DELETE', '/api/profiles')).toEqual({
      status: 403,
      code: 'error.profiles.chooseWhoIsWatching',
    });
  });

  it('turns a session that has not chosen away from changing the account’s sign-in', async () => {
    expect(await ask(UNCHOSEN, 'POST', '/api/auth/change-password')).toEqual({
      status: 403,
      code: 'error.profiles.onlyTheOwnerCanDoThat',
    });
  });

  it('lets the owner do everything the account may', async () => {
    for (const [method, path] of [
      ['PATCH', '/api/account'],
      ['PUT', '/api/account/photo'],
      ['DELETE', '/api/account/photo'],
      ['POST', '/api/account/onboarding'],
      ['GET', '/api/account/devices'],
      ['DELETE', '/api/account/devices/device-1'],
      ['POST', '/api/profiles'],
      ['GET', '/api/keys'],
      ['POST', '/api/keys'],
      ['POST', '/api/setup-links/password'],
      ['POST', '/api/auth/change-password'],
      ['POST', '/api/auth/change-email'],
      ['POST', '/api/auth/two-factor/enable'],
    ] as const) {
      expect(await ask(OWNER, method, path)).toEqual({ status: 200, code: null });
    }
  });

  it('turns any other profile away from what changes the account itself', async () => {
    for (const [method, path] of [
      ['PATCH', '/api/account'],
      ['PUT', '/api/account/photo'],
      ['DELETE', '/api/account/photo'],
      ['POST', '/api/account/onboarding'],
      ['GET', '/api/account/devices'],
      ['DELETE', '/api/account/devices/device-1'],
      ['POST', '/api/profiles'],
      ['GET', '/api/keys'],
      ['DELETE', '/api/keys/key-1'],
      ['POST', '/api/setup-links/password'],
      ['POST', '/api/auth/change-password'],
      ['POST', '/api/auth/change-email'],
      ['POST', '/api/auth/two-factor/enable'],
      ['POST', '/api/auth/passkey/add-passkey'],
      ['POST', '/api/auth/delete-user'],
    ] as const) {
      expect(await ask(KID, method, path)).toEqual({
        status: 403,
        code: 'error.profiles.onlyTheOwnerCanDoThat',
      });
    }
  });

  it('lets any other profile watch, look after itself and sign out', async () => {
    for (const [method, path] of [
      ['GET', '/api/libraries'],
      ['GET', '/api/account/onboarding'],
      ['GET', '/api/profiles'],
      ['PATCH', '/api/profiles/kid'],
      ['PUT', '/api/profiles/kid/pin'],
      ['POST', '/api/profiles/parent/choose'],
      ['DELETE', '/api/profiles/chosen'],
      ['GET', '/api/auth/get-session'],
      ['POST', '/api/auth/sign-out'],
      ['POST', '/api/auth/sign-in/email'],
      ['POST', '/api/auth/two-factor/verify-totp'],
      ['POST', '/api/auth/multi-session/set-active'],
      ['POST', '/api/auth/device/token'],
      ['GET', '/api/auth/jwks'],
    ] as const) {
      expect(await ask(KID, method, path)).toEqual({ status: 200, code: null });
    }
  });

  it('treats a server without profiles as its account’s owner', async () => {
    expect(await ask(WITHOUT_PROFILES, 'PATCH', '/api/account')).toEqual({
      status: 200,
      code: null,
    });
  });

  it('turns everybody away from making API keys behind Valence’s back', async () => {
    for (const acting of [OWNER, KID, UNCHOSEN, WITHOUT_PROFILES, null]) {
      expect(await ask(acting, 'POST', '/api/auth/api-key/create')).toEqual({
        status: 403,
        code: 'error.profiles.keysAreMadeInValence',
      });
    }
  });

  it('turns away a key’s every address, not only making one', async () => {
    for (const [method, path] of [
      ['GET', '/api/auth/api-key/list'],
      ['POST', '/api/auth/api-key/update'],
      ['POST', '/api/auth/api-key/delete'],
    ] as const) {
      expect((await ask(OWNER, method, path)).code).toBe('error.profiles.keysAreMadeInValence');
    }
  });

  it('turns keys away without asking who is acting', async () => {
    const { app, readActing } = behindTheGate(OWNER);

    await app.request(`${BASE}/api/auth/api-key/create`, { method: 'POST' });

    expect(readActing).not.toHaveBeenCalled();
  });
});
