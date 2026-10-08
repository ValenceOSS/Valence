import { z } from 'zod';
import { createAuthClient } from 'better-auth/client';
import { AUTH_BASE, askTheServer } from '@ValenceClient/session/askTheServer';
import {
  adminClient,
  deviceAuthorizationClient,
  twoFactorClient,
  usernameClient,
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { PasskeyCreationOptionsSchema } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import { PasskeyRequestOptionsSchema } from '@ValenceContracts/schemas/PasskeyRequestOptions';
import type { PasskeyAssertion } from '@ValenceContracts/schemas/PasskeyAssertion';
import type { PasskeyAttestation } from '@ValenceContracts/schemas/PasskeyAttestation';
import type { PasskeyCreationOptions } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import type { PasskeyRequestOptions } from '@ValenceContracts/schemas/PasskeyRequestOptions';
import type { SessionUser } from '@ValenceContracts/schemas/Session';
import type { Passkey } from '@ValenceContracts/schemas/Passkey';
import { say } from '@ValenceI18n/say';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';

type RegisterOutcome =
  | { kind: 'registered' }
  | { kind: 'cancelled' }
  | { kind: 'unconfirmed' }
  | { kind: 'failed'; reason: string };

type ConfirmOutcome = { kind: 'confirmed' } | { kind: 'failed'; reason: string };

type AuthenticateOutcome =
  | { kind: 'signedIn' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: string };

type Enrollment = { totpURI: string; backupCodes: string[] };

type DeviceGrant = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  intervalSeconds: number;
  expiresInSeconds: number;
};

type DeviceGrantOutcome =
  | { kind: 'waiting' }
  | { kind: 'slowDown' }
  | { kind: 'signedIn'; token: string }
  | { kind: 'refused' }
  | { kind: 'expired' }
  | { kind: 'failed'; reason: string };

type DeviceRequest = { userCode: string; status: 'pending' | 'approved' | 'denied' };

const CANCELLED = new Set(['AUTH_CANCELLED', 'ERROR_CEREMONY_ABORTED']);

/**
 * Builds the one client that speaks to better-auth, which this module holds and nothing else sees.
 *
 * Every request to `/api/auth` goes through it rather than being written out as a `fetch` with a
 * hand-written schema beside it. The library types its own protocol, so an endpoint or a payload
 * that changes underneath us stops the build rather than a passkey ceremony in production.
 *
 * The vanilla client rather than the React one, because the answers belong in the shared cache with
 * everything else the server has said, not in a second store of the library's own. It is not
 * exported either, and the reason is worth knowing: the type of a client carrying three plugins is
 * longer than TypeScript will serialise across a module boundary, so what leaves this module is a
 * set of named functions with types of their own. That is the better shape anyway — a component
 * should ask for what it wants rather than reach for a client.
 *
 * The plugins are the ones the server mounts and this application calls: `admin` for the role on a
 * user, `twoFactor`, `passkey`, and `deviceAuthorization` for signing a television in from a phone.
 *
 * Its `fetch` is handed over rather than left to be found, for two reasons and no others: the
 * library reads the global once when the client is built, which is before a test has had a chance
 * to stand in for it, and it asks with a `URL` where a caller may be expecting a string.
 *
 * Nothing else is done to the request. A shim here once added a content type as well, on the theory
 * that the library sent a body without naming it — it sends `{}` with `application/json` and
 * `credentials: include` of its own accord, so that was an answer to a question nobody had asked,
 * sitting on the one path where a mistake ends a session or fails to.
 *
 * @returns The client.
 */
const buildClient = () =>
  createAuthClient({
    baseURL: AUTH_BASE,
    basePath: '/api/auth',
    fetchOptions: { customFetchImpl: askTheServer },
    plugins: [
      adminClient(),
      twoFactorClient(),
      passkeyClient(),
      deviceAuthorizationClient(),
      usernameClient(),
    ],
  });

const client = buildClient();

const CodedSchema = z.object({ code: z.string() });

const TwoFactorRedirectSchema = z.object({ twoFactorRedirect: z.literal(true) });

const ConfirmationSchema = z.object({ isConfirmed: z.boolean() });

/**
 * Whether a refusal was somebody changing their mind rather than something going wrong.
 *
 * The code is read through a schema because the library types its errors without one, while the
 * passkey plugin sets it — and telling a cancellation from a failure decides whether the person is
 * shown a message or nothing at all.
 *
 * @param error - What the client refused with.
 * @returns Whether it was a cancellation.
 */
const wasCancelled = (error: object): boolean => {
  const read = CodedSchema.safeParse(error);

  return read.success && CANCELLED.has(read.data.code);
};

/**
 * Reads the current session: who is signed in, what they may do, and whether they have got as far as
 * a second factor. The first thing the application asks, and what decides whether it shows the
 * library or the way in.
 *
 * Throws where the server could not be reached, rather than answering with nobody: a tab that cannot
 * reach Valence should say so, not offer the way in as though somebody had signed out.
 *
 * @returns Who is signed in, or nobody.
 */
const fetchSession = async (): Promise<SessionUser | null> => {
  const { data, error } = await client.getSession();

  if (error !== null) {
    throw new Error(`Session request failed with status ${String(error.status)}`);
  }

  if (data === null) {
    return null;
  }

  return {
    id: data.user.id,
    name: data.user.name,
    email: realEmailOf(data.user.email),
    username: data.user.displayUsername ?? data.user.username ?? null,
    emailVerified: data.user.emailVerified,
    image: data.user.image,
    role: data.user.role,
    twoFactorEnabled: data.user.twoFactorEnabled,
  };
};

/**
 * Signs in with a username or an address, and a password, which is the way in for a server that does
 * not show who lives here.
 *
 * The face wall is the ordinary way in and this is the other one: where the server keeps its
 * profiles to itself, there is nothing to pick from, so somebody types who they are instead. What
 * they typed is an address when it has an @ in it and a username otherwise, and is sent to the
 * matching endpoint. It answers in the same three ways picking a face does, so the screen can treat
 * them alike — including a second factor, which better-auth asks for by redirecting rather than by
 * refusing.
 *
 * @param identifier - The username or the address on the account.
 * @param password - Its password.
 * @returns Whether it worked, whether a code is wanted next, and why not where it did not.
 */
const signInWithUsernameOrEmail = async (
  identifier: string,
  password: string,
): Promise<{ kind: 'signedIn' } | { kind: 'needsCode' } | { kind: 'refused'; reason: string }> => {
  const named = identifier.trim();
  const answer = await (
    named.includes('@')
      ? client.signIn.email({ email: named, password })
      : client.signIn.username({ username: named, password })
  ).catch(() => null);

  if (answer === null) {
    return { kind: 'refused', reason: say('common.valenceCouldNotBeReached') };
  }

  if (answer.error !== null) {
    return {
      kind: 'refused',
      reason: say('client.session.auth.thatUsernameOrAddressAndPassword'),
    };
  }

  return TwoFactorRedirectSchema.safeParse(answer.data).success
    ? { kind: 'needsCode' }
    : { kind: 'signedIn' };
};

/**
 * Ends this session on the server, so the cookie is cleared where it was issued rather than only
 * being forgotten here, and forgets which face this device was watching as.
 *
 * The face is held on the device rather than in the session, which is what makes signing out easy to
 * get wrong: end the session alone and the next person to sign in on this television is silently
 * treated as whoever used it last, with their history and their place in everything.
 *
 * Whether it worked is read from the refusal, the way every other call in this module reads it. It
 * was once taken from the library's success hook instead, which is a second way of asking the same
 * question and the only one here that could answer no while the server had said yes.
 *
 * The face is forgotten either way, and so is any token this client was holding. A sign-out that did
 * not reach the server still means somebody walked away from this device, and leaving their face —
 * or a credential that still works — on it is the failure that matters.
 *
 * @returns Whether the session was ended.
 */
const signOut = async (): Promise<boolean> => {
  const { error } = await client.signOut();

  writeCurrentProfile(null);

  return error === null;
};

/**
 * What went wrong, in words, from whatever a host threw while asking its system for a passkey.
 *
 * @param error - What was thrown.
 * @param otherwise - What to say where it carried no message.
 * @returns The reason.
 */
const whyTheSystemSaidNo = (error: Error | string | null | undefined, otherwise: string): string =>
  error instanceof Error && error.message !== '' ? error.message : otherwise;

/**
 * Whether this session was signed in, or confirmed, recently enough for the server to let it add a
 * passkey — which it only checks once the passkey has been made, too late to say anything useful.
 *
 * A server that cannot say is taken to be one that does not ask, which is how every server before
 * this question behaved.
 *
 * @returns Whether it is.
 */
const isThisSessionConfirmed = async (): Promise<boolean> => {
  const answer = await client
    .$fetch('/confirmation', { method: 'GET', throw: false })
    .catch(() => null);
  const read = ConfirmationSchema.safeParse(answer?.data);

  return read.success ? read.data.isConfirmed : true;
};

/**
 * Confirms it is still the person signed in, with their password, so the server treats this session
 * as freshly signed in.
 *
 * @param password - Their password.
 * @returns Whether it was confirmed, and why not where it was not.
 */
const confirmItIsYou = async (password: string): Promise<ConfirmOutcome> => {
  const answer = await client
    .$fetch('/confirm-it-is-you', { method: 'POST', body: { password }, throw: false })
    .catch(() => null);

  if (answer === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  return answer.error === null
    ? { kind: 'confirmed' }
    : {
        kind: 'failed',
        reason:
          answer.error.status === 429
            ? say('client.session.auth.tooManyTriesWaitAMinute')
            : (answer.error.message ?? say('common.thatIsNotYourPassword')),
      };
};

/**
 * Adds a passkey through the host's own operating system rather than the page, for a host whose
 * pages the browser engine will not let make one for the server.
 *
 * The same two requests the library makes — options, then what was made — with the ceremony
 * between them handed to the host, which asks the system over its own window.
 *
 * @param name - What to call this device in the list of passkeys.
 * @param make - The host's way of making one.
 * @returns Whether it worked, and why not where it did not.
 */
const registerThroughTheSystem = async (
  name: string,
  make: (options: PasskeyCreationOptions) => Promise<PasskeyAttestation | null>,
): Promise<RegisterOutcome> => {
  const asked = await client
    .$fetch('/passkey/generate-register-options', { method: 'GET', query: { name }, throw: false })
    .catch(() => null);
  const options = PasskeyCreationOptionsSchema.safeParse(asked?.data);

  if (!options.success) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  let made: PasskeyAttestation | null;

  try {
    made = await make(options.data);
  } catch (error) {
    return {
      kind: 'failed',
      reason: whyTheSystemSaidNo(
        error instanceof Error ? error : null,
        say('client.session.auth.yourDeviceCouldNotCreateA'),
      ),
    };
  }

  if (made === null) {
    return { kind: 'cancelled' };
  }

  const verified = await client
    .$fetch('/passkey/verify-registration', {
      method: 'POST',
      body: { response: made, name },
      throw: false,
    })
    .catch(() => null);

  if (verified === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  return verified.error === null
    ? { kind: 'registered' }
    : {
        kind: 'failed',
        reason: verified.error.message ?? say('client.session.auth.yourDeviceCouldNotCreateA'),
      };
};

/**
 * Runs the registration ceremony and hands the result to the server, which is how a device becomes
 * something somebody can sign in with instead of a password.
 *
 * A browser runs it in the page. A host whose pages cannot hands it to its operating system. One
 * that adds passkeys somewhere else entirely, or cannot at all, is refused here, since the account
 * page offers it no button that would call this. A session signed in too long ago is turned away
 * before anything is made, so that confirming it is them comes first rather than a passkey the server
 * then refuses.
 *
 * @param name - What to call this device in the list of passkeys.
 * @returns Whether it worked, and why not where it did not.
 */
const registerPasskey = async (name: string): Promise<RegisterOutcome> => {
  const passkeys = platformInUse().passkeys();

  if (passkeys.kind === 'through-a-sign-in-page') {
    return { kind: 'failed', reason: say('client.session.auth.addAPasskeyFromValenceIn') };
  }

  if (passkeys.kind === 'none') {
    return { kind: 'failed', reason: passkeys.why };
  }

  if (!(await isThisSessionConfirmed())) {
    return { kind: 'unconfirmed' };
  }

  if (passkeys.kind === 'through-the-system') {
    return await registerThroughTheSystem(name, passkeys.make);
  }

  const answer = await client.passkey.addPasskey({ name }).catch(() => null);

  if (answer === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  const error = answer.error ?? null;

  if (error === null) {
    return { kind: 'registered' };
  }

  if (wasCancelled(error)) {
    return { kind: 'cancelled' };
  }

  return {
    kind: 'failed',
    reason: error.message ?? say('client.session.auth.yourDeviceCouldNotCreateA'),
  };
};

/**
 * Signs in with a passkey the host asks its own operating system for, the same two requests the
 * library makes with the ceremony between them handed over.
 *
 * @param ask - The host's way of asking for one.
 * @returns Whether it worked, and why not where it did not.
 */
const authenticateThroughTheSystem = async (
  ask: (options: PasskeyRequestOptions) => Promise<PasskeyAssertion | null>,
): Promise<AuthenticateOutcome> => {
  const asked = await client
    .$fetch('/passkey/generate-authenticate-options', { method: 'GET', throw: false })
    .catch(() => null);
  const options = PasskeyRequestOptionsSchema.safeParse(asked?.data);

  if (!options.success) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  let signed: PasskeyAssertion | null;

  try {
    signed = await ask(options.data);
  } catch (error) {
    return {
      kind: 'failed',
      reason: whyTheSystemSaidNo(
        error instanceof Error ? error : null,
        say('client.session.auth.thatPasskeyWasNotAccepted'),
      ),
    };
  }

  if (signed === null) {
    return { kind: 'cancelled' };
  }

  const verified = await client
    .$fetch('/passkey/verify-authentication', {
      method: 'POST',
      body: { response: signed },
      throw: false,
    })
    .catch(() => null);

  if (verified === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  return verified.error === null
    ? { kind: 'signedIn' }
    : {
        kind: 'failed',
        reason: verified.error.message ?? say('client.session.auth.thatPasskeyWasNotAccepted'),
      };
};

/**
 * Signs in with a passkey: whatever credential the person chooses signs a challenge, and the result
 * is checked by the server. The password is never involved, and nothing secret leaves the device.
 *
 * Where it happens is the host's to say. A browser signs in the page; a host whose pages cannot asks
 * its operating system; a host that cannot do either here signs in on a page elsewhere and is handed
 * the session back.
 *
 * @param profileId - The face somebody already chose, which a page elsewhere asks for straight away.
 * @returns Whether it worked, and why not where it did not.
 */
const authenticateWithPasskey = async (
  profileId: string | null = null,
): Promise<AuthenticateOutcome> => {
  const passkeys = platformInUse().passkeys();

  if (passkeys.kind === 'through-the-system') {
    return await authenticateThroughTheSystem(passkeys.ask);
  }

  if (passkeys.kind === 'through-a-sign-in-page') {
    const outcome = await passkeys.signIn(profileId);

    return outcome === 'in'
      ? { kind: 'signedIn' }
      : outcome === 'cancelled'
        ? { kind: 'cancelled' }
        : { kind: 'failed', reason: say('common.thatDidNotSignYouIn') };
  }

  if (passkeys.kind === 'none') {
    return { kind: 'failed', reason: passkeys.why };
  }

  const answer = await client.signIn.passkey().catch(() => null);

  if (answer === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  const error = answer.error ?? null;

  if (error === null) {
    return { kind: 'signedIn' };
  }

  if (wasCancelled(error)) {
    return { kind: 'cancelled' };
  }

  return {
    kind: 'failed',
    reason: error.message ?? say('client.session.auth.thatPasskeyWasNotAccepted'),
  };
};

/**
 * Lists the passkeys enrolled on this account, with when each was last used. A passkey nobody
 * recognises is one worth removing, and last use is what makes that judgeable.
 *
 * @returns The passkeys, newest first as the server ordered them.
 */
const listPasskeys = async (): Promise<Passkey[]> => {
  const { data, error } = await client.passkey.listUserPasskeys();

  if (error !== null) {
    throw new Error(`Passkey list failed with status ${String(error.status)}`);
  }

  return data.map((passkey) => ({
    id: passkey.id,
    name: passkey.name,
    deviceType: passkey.deviceType,
    backedUp: passkey.backedUp,
    createdAt: passkey.createdAt.toISOString(),
  }));
};

/**
 * Whether this account has a password to sign in with, which one set up with only a passkey does not.
 *
 * @returns Whether it has one.
 */
const hasAPassword = async (): Promise<boolean> => {
  const { data, error } = await client.listAccounts();

  if (error !== null) {
    throw new Error(`Account list failed with status ${String(error.status)}`);
  }

  return data.some((account) => account.providerId === 'credential');
};

/**
 * Removes a registered passkey, for somebody who has lost the device it lived on.
 *
 * @param id - The passkey to remove.
 * @returns Whether it was removed.
 */
const deletePasskey = async (id: string): Promise<boolean> => {
  const { error } = await client.passkey.deletePasskey({ id });

  return error === null;
};

/**
 * Renames a registered passkey, since a list of them is unusable when each is called the same thing.
 *
 * @param id - The passkey to rename.
 * @param name - What to call it.
 * @returns Whether it was renamed.
 */
const renamePasskey = async (id: string, name: string): Promise<boolean> => {
  const { error } = await client.passkey.updatePasskey({ id, name });

  return error === null;
};

/**
 * Starts enrolling a second factor, which the password is needed for: turning it on is a change to
 * how this account is protected, and a borrowed session should not be able to make it.
 *
 * The server may answer that it enrolled a code sent by mail instead, which this account is not set
 * up for and Valence does not offer. There is nothing to show for that, so it is treated as nothing
 * rather than half a screen with no secret on it.
 *
 * @param password - The account's password.
 * @returns The secret to enrol against and the backup codes, or nothing where the password was wrong.
 */
const enableTwoFactor = async (password: string): Promise<Enrollment | null> => {
  const { data, error } = await client.twoFactor.enable({ password });

  if (error !== null || data.method !== 'totp') {
    return null;
  }

  return { totpURI: data.totpURI, backupCodes: data.backupCodes };
};

/**
 * Checks a code from an authenticator, which both finishes enrolment and answers the challenge at
 * sign-in.
 *
 * @param code - The six digits shown by the authenticator.
 * @returns Whether it was accepted.
 */
const verifyTotp = async (code: string): Promise<boolean> => {
  const { error } = await client.twoFactor.verifyTotp({ code });

  return error === null;
};

/**
 * Checks one of the backup codes, for somebody who has lost the device their authenticator was on.
 *
 * @param code - The backup code.
 * @returns Whether it was accepted.
 */
const verifyBackupCode = async (code: string): Promise<boolean> => {
  const { error } = await client.twoFactor.verifyBackupCode({ code });

  return error === null;
};

/**
 * Turns the second factor off, which the password is needed for, for the same reason turning it on
 * is.
 *
 * @param password - The account's password.
 * @returns Whether it was turned off.
 */
const disableTwoFactor = async (password: string): Promise<boolean> => {
  const { error } = await client.twoFactor.disable({ password });

  return error === null;
};

const THIS_TELEVISION = 'valence-tv';

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

const RefusedSchema = z.object({ error: z.string() });

const DeviceRequestSchema = z.object({
  user_code: z.string(),
  status: z.enum(['pending', 'approved', 'denied']),
});

/**
 * Reads what a device grant was refused with, which is an OAuth error name rather than a message.
 *
 * The name is what the whole flow turns on — waiting, slowing down, refused, or over — and the
 * library types its errors loosely enough that reading the field directly would be a guess.
 *
 * @param error - What the client refused with.
 * @returns The error name, or null where there was not one.
 */
const whyItWasRefused = (error: object): string | null => {
  const read = RefusedSchema.safeParse(error);

  return read.success ? read.data.error : null;
};

/**
 * Asks the server for a code somebody can type on their phone, which is how a television signs in
 * without anybody spelling an address out with a remote.
 *
 * @returns The grant to show and poll against, or null where the server would not start one.
 */
const startDeviceGrant = async (): Promise<DeviceGrant | null> => {
  const answer = await client.device.code({ client_id: THIS_TELEVISION }).catch(() => null);

  if (answer === null || answer.error !== null) {
    return null;
  }

  const { data } = answer;

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    verificationUriComplete: data.verification_uri_complete,
    intervalSeconds: data.interval,
    expiresInSeconds: data.expires_in,
  };
};

/**
 * Asks whether the grant has been approved yet, which is the one call a television makes over and
 * over while somebody deals with their phone.
 *
 * Polled rather than pushed. A television that has not signed in has no account for a realtime
 * message to be addressed to, and the grant already names a rate to ask at.
 *
 * Once it is approved, what comes back carries the session's token as well as the cookie the server
 * sets beside it. A browser has no use for it; an app that keeps no cookies signs every request with
 * it instead.
 *
 * @param deviceCode - The code the grant was started with, which is not the one on screen.
 * @returns Where the grant has got to.
 */
const askWhetherTheDeviceMayIn = async (deviceCode: string): Promise<DeviceGrantOutcome> => {
  const answer = await client.device
    .token({ grant_type: DEVICE_GRANT, device_code: deviceCode, client_id: THIS_TELEVISION })
    .catch(() => null);

  if (answer === null) {
    return { kind: 'failed', reason: say('common.valenceCouldNotBeReached') };
  }

  if (answer.error === null) {
    return { kind: 'signedIn', token: answer.data.access_token };
  }

  const why = whyItWasRefused(answer.error);

  if (why === 'authorization_pending') {
    return { kind: 'waiting' };
  }

  if (why === 'slow_down') {
    return { kind: 'slowDown' };
  }

  if (why === 'access_denied') {
    return { kind: 'refused' };
  }

  if (why === 'expired_token' || why === 'invalid_grant') {
    return { kind: 'expired' };
  }

  return { kind: 'failed', reason: say('client.session.auth.thatCodeWasNotAccepted') };
};

/**
 * Reads what a typed code is asking for, so the person holding the phone sees what they are about
 * to let in rather than approving a string of letters.
 *
 * @param userCode - The code somebody read off the television.
 * @returns What is being asked, or null where the code means nothing or has run out.
 */
const readDeviceRequest = async (userCode: string): Promise<DeviceRequest | null> => {
  const answer = await client.device({ query: { user_code: userCode } }).catch(() => null);

  if (answer === null || answer.error !== null) {
    return null;
  }

  const read = DeviceRequestSchema.safeParse(answer.data);

  return read.success ? { userCode: read.data.user_code, status: read.data.status } : null;
};

/**
 * Lets a television in, or turns it away.
 *
 * Turning it away is offered as plainly as letting it in, because somebody typing a code they did
 * not expect to be asked for is the case this exists to catch.
 *
 * @param userCode - The code shown on the television.
 * @param isAllowed - Whether it may in.
 * @returns Whether the answer was recorded.
 */
const answerDeviceRequest = async (userCode: string, isAllowed: boolean): Promise<boolean> => {
  const answer = await (
    isAllowed ? client.device.approve({ userCode }) : client.device.deny({ userCode })
  ).catch(() => null);

  return answer !== null && answer.error === null;
};

export type {
  ConfirmOutcome,
  RegisterOutcome,
  AuthenticateOutcome,
  Enrollment,
  DeviceGrant,
  DeviceGrantOutcome,
  DeviceRequest,
};

export {
  fetchSession,
  signInWithUsernameOrEmail,
  signOut,
  registerPasskey,
  isThisSessionConfirmed,
  confirmItIsYou,
  authenticateWithPasskey,
  listPasskeys,
  hasAPassword,
  deletePasskey,
  renamePasskey,
  enableTwoFactor,
  verifyTotp,
  verifyBackupCode,
  disableTwoFactor,
  startDeviceGrant,
  askWhetherTheDeviceMayIn,
  readDeviceRequest,
  answerDeviceRequest,
  THIS_TELEVISION,
};
