import { describe, expect, it, vi } from 'vitest';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryChosenProfiles } from '@ValenceServer/profiles/createMemoryChosenProfiles';
import type { ResolvesSessions } from '@ValenceServer/auth/readSessionOnce';
import { readActing } from './readActing';

const COLOUR = '#3ac47d';

/**
 * Somebody signed in to an account of their own, with every service the reading asks.
 *
 * @returns The services, the account, its session, and fresh headers carrying that session.
 */
const signedIn = async () => {
  const { auth, store } = createMemoryAuth();
  const cookie = await signUpForTest(
    {
      request: (input, init) =>
        auth.handler(
          typeof input === 'string' ? new Request(new URL(input, TEST_ORIGIN), init) : input,
        ),
    },
    auth,
  );
  const headers = () => new Headers({ cookie });
  const session = await auth.api.getSession({ headers: headers() });

  return {
    auth,
    session,
    headers,
    accountId: store.user[0]?.id ?? '',
    sessionId: session?.session.id ?? '',
    profiles: createMemoryProfileService(),
    chosen: createMemoryChosenProfiles(),
  };
};

/**
 * Sessions resolved as though an API key with this identifier had been sent.
 *
 * @param session - The session to answer with.
 * @param keyId - Which key it is.
 * @returns What resolves it.
 */
const viaKey = (
  session: Awaited<ReturnType<typeof signedIn>>['session'],
  keyId: string,
): ResolvesSessions => ({
  api: {
    getSession: () =>
      Promise.resolve(
        session === null
          ? null
          : { ...session, session: { ...session.session, id: keyId, token: KEY } },
      ),
  },
});

const KEY = 'valence_key';

const keyHeaders = (key = KEY) => new Headers({ 'x-api-key': key });

describe('readActing', () => {
  it('answers with nobody where nobody is signed in', async () => {
    const { auth, profiles, chosen } = await signedIn();

    await expect(readActing({ auth, profiles, chosen }, new Headers())).resolves.toBeNull();
  });

  it('acts as the account alone on a server without profiles', async () => {
    const { auth, chosen, headers, accountId, sessionId } = await signedIn();

    await expect(readActing({ auth, chosen }, headers())).resolves.toEqual({
      account: { id: accountId, name: 'Marques', email: 'marques@valence.local' },
      sessionId,
      isViaKey: false,
      profile: null,
      mustChoose: false,
    });
  });

  it('makes the account’s first profile, and chooses it, where it has none', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();

    const acting = await readActing({ auth, profiles, chosen }, headers());
    const [made] = await profiles.list(accountId);

    expect(acting?.profile).toEqual({
      id: made?.id,
      name: 'Marques',
      isOwner: true,
      mayRequest: true,
    });
    expect(acting?.mustChoose).toBe(false);
    await expect(chosen.chosenFor(sessionId)).resolves.toBe(made?.id);
  });

  it('chooses an account’s only profile for it, where it has no PIN', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();
    const only = await profiles.ensureDefault(accountId, 'Dan');

    const acting = await readActing({ auth, profiles, chosen }, headers());

    expect(acting?.profile?.id).toBe(only.id);
    await expect(chosen.chosenFor(sessionId)).resolves.toBe(only.id);
  });

  it('makes somebody choose an only profile that has a PIN', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();
    const only = await profiles.ensureDefault(accountId, 'Dan');

    await profiles.setPin(only.id, hashSecret('2468'));

    const acting = await readActing({ auth, profiles, chosen }, headers());

    expect(acting).toMatchObject({ profile: null, mustChoose: true });
    await expect(chosen.chosenFor(sessionId)).resolves.toBeNull();
  });

  it('makes somebody choose where the account has several profiles', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    const acting = await readActing({ auth, profiles, chosen }, headers());

    expect(acting).toMatchObject({ profile: null, mustChoose: true, isViaKey: false });
    await expect(chosen.chosenFor(sessionId)).resolves.toBeNull();
  });

  it('acts as the profile the session chose', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');

    const kid = await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    await profiles.setMayRequest(kid.id, false);
    await chosen.choose(sessionId, kid.id);

    await expect(readActing({ auth, profiles, chosen }, headers())).resolves.toMatchObject({
      profile: { id: kid.id, name: 'Kid', isOwner: false, mayRequest: false },
      mustChoose: false,
    });
  });

  it('ignores a chosen profile that belongs to another account', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    const theirs = await profiles.ensureDefault('somebody-else', 'Them');

    await chosen.choose(sessionId, theirs.id);

    await expect(readActing({ auth, profiles, chosen }, headers())).resolves.toMatchObject({
      profile: null,
      mustChoose: true,
    });
  });

  it('chooses the lone profile again where the chosen one is from another account', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();
    const mine = await profiles.ensureDefault(accountId, 'Dan');
    const theirs = await profiles.ensureDefault('somebody-else', 'Them');

    await chosen.choose(sessionId, theirs.id);

    await expect(readActing({ auth, profiles, chosen }, headers())).resolves.toMatchObject({
      profile: { id: mine.id },
      mustChoose: false,
    });
    await expect(chosen.chosenFor(sessionId)).resolves.toBe(mine.id);
  });

  it('makes somebody choose again where the chosen profile has gone', async () => {
    const { auth, profiles, chosen, headers, accountId, sessionId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });
    await chosen.choose(sessionId, '3f2504e0-4f89-41d3-9a0c-0305e82c3301');

    await expect(readActing({ auth, profiles, chosen }, headers())).resolves.toMatchObject({
      profile: null,
      mustChoose: true,
    });
  });

  it('acts as the profile an API key was made for', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');

    const kid = await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    await chosen.tieKey('key-1', kid.id);

    await expect(
      readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders()),
    ).resolves.toMatchObject({
      sessionId: 'key-1',
      isViaKey: true,
      profile: { id: kid.id, isOwner: false },
      mustChoose: false,
    });
  });

  it('acts as nobody for a key tied to no profile, rather than as the owner', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    await expect(
      readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders()),
    ).resolves.toMatchObject({ isViaKey: true, profile: null, mustChoose: true });
  });

  it('acts as nobody for a key tied to a profile on another account', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();
    const theirs = await profiles.ensureDefault('somebody-else', 'Them');

    await profiles.ensureDefault(accountId, 'Dan');
    await chosen.tieKey('key-1', theirs.id);

    await expect(
      readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders()),
    ).resolves.toMatchObject({ profile: null, mustChoose: true });
  });

  it('acts as nobody for a key whose profile has been removed', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await chosen.tieKey('key-1', '3f2504e0-4f89-41d3-9a0c-0305e82c3301');

    await expect(
      readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders()),
    ).resolves.toMatchObject({ profile: null, mustChoose: true });
  });

  it('is not a key where the header is empty, but the session it came with', async () => {
    const { auth, profiles, chosen, accountId, headers } = await signedIn();
    const withAnEmptyKey = headers();

    withAnEmptyKey.set('x-api-key', '');
    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    await expect(readActing({ auth, profiles, chosen }, withAnEmptyKey)).resolves.toMatchObject({
      isViaKey: false,
      profile: null,
      mustChoose: true,
    });
  });

  it('is not a key where the session resolved is not the key named', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await profiles.create(accountId, { name: 'Kid', colour: COLOUR });

    await expect(
      readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders('another_key')),
    ).resolves.toMatchObject({ isViaKey: false, mustChoose: true });
  });

  it('makes the owner profile for a key on an account that has none yet, and acts as it', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    const acting = await readActing(
      { auth: viaKey(session, 'key-1'), profiles, chosen },
      keyHeaders(),
    );
    const everyone = await profiles.list(accountId);

    expect(everyone).toHaveLength(1);
    expect(acting).toMatchObject({
      isViaKey: true,
      profile: { id: everyone[0]?.id, isOwner: true },
      mustChoose: false,
    });
  });

  it('never chooses on behalf of a key, even for a lone profile', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();

    await profiles.ensureDefault(accountId, 'Dan');
    await readActing({ auth: viaKey(session, 'key-1'), profiles, chosen }, keyHeaders());

    await expect(chosen.chosenFor('key-1')).resolves.toBeNull();
  });

  it('works it out once per request rather than once per question', async () => {
    const { session, profiles, chosen, accountId } = await signedIn();
    const getSession = vi.fn<ResolvesSessions['api']['getSession']>().mockResolvedValue(session);
    const list = vi.spyOn(profiles, 'list');
    const headers = new Headers();

    await profiles.ensureDefault(accountId, 'Dan');

    const first = readActing({ auth: { api: { getSession } }, profiles, chosen }, headers);
    const second = readActing({ auth: { api: { getSession } }, profiles, chosen }, headers);

    expect(second).toBe(first);
    await first;
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('works it out again for a different request', async () => {
    const { session, profiles, chosen } = await signedIn();
    const getSession = vi.fn<ResolvesSessions['api']['getSession']>().mockResolvedValue(session);

    await readActing({ auth: { api: { getSession } }, profiles, chosen }, new Headers());
    await readActing({ auth: { api: { getSession } }, profiles, chosen }, new Headers());

    expect(getSession).toHaveBeenCalledTimes(2);
  });
});
