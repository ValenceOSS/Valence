import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { setCookie } from 'hono/cookie';
import {
  LibraryLockRequestSchema,
  LibraryLocksSchema,
  LibraryUnlockRequestSchema,
} from '@ValenceContracts/schemas/LibraryLock';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { cookieOf } from '@ValenceServer/locks/cookieOf';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import { secretMatches } from '@ValenceServer/locks/secretMatches';
import { unlockToken } from '@ValenceServer/locks/unlockToken';
import { unlockedLibraries } from '@ValenceServer/locks/unlockedLibraries';
import { UNLOCKED_COOKIE } from '@ValenceServer/locks/UNLOCKED_COOKIE';
import { unlockHolderOf } from '@ValenceServer/locks/unlockHolderOf';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const TRIES = 5;

/**
 * Registers locking a library behind a password or PIN, and unlocking it on a device for a while.
 *
 * The lock is kept in the server's settings as a hash, and an unlocking as a cookie the server
 * signed, naming the library, the account, when it runs out and the lock as it then stood — so it
 * cannot be made by hand, moved to another account or kept past a change of password. Five wrong
 * tries in a minute are refused until the minute is up, so a PIN cannot simply be counted through.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLibraryLocks = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, settings, readActing, unlockSecret } = context;
  const tries = new Map<string, { count: number; sinceMs: number }>();

  const locksNow = async () =>
    LibraryLocksSchema.catch({}).parse((await settings.read()).libraryLocks);

  app.put('/api/admin/libraries/:libraryId/lock', async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const libraryId = context.req.param('libraryId');
    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const asked = LibraryLockRequestSchema.safeParse(body.success ? body.data : null);

    if (!asked.success) {
      return context.json(refuse('error.libraryLock.thatLockCouldNotBeRead'), 400);
    }

    const { [libraryId]: _was, ...others } = await locksNow();

    await settings.write({
      libraryLocks:
        asked.data.secret === null
          ? others
          : {
              ...others,
              [libraryId]: {
                hash: hashSecret(asked.data.secret),
                relockMinutes: asked.data.relockMinutes,
              },
            },
    });

    return context.json({ hasLock: asked.data.secret !== null }, 200);
  });

  app.post('/api/libraries/:libraryId/unlock', async (context) => {
    const acting = await readActing(context.req.raw.headers);

    if (acting === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const libraryId = context.req.param('libraryId');
    const lock = (await locksNow())[libraryId];

    if (lock === undefined) {
      return context.json({ untilMs: null }, 200);
    }

    const holder = unlockHolderOf({
      accountId: acting.account.id,
      profileId: acting.profile?.id ?? null,
    });
    const key = `${acting.account.id}:${libraryId}`;
    const nowMs = Date.now();
    const tried = tries.get(key);
    const recent = tried === undefined || nowMs - tried.sinceMs > MINUTE_MS ? null : tried;

    if (recent !== null && recent.count >= TRIES) {
      return context.json(refuse('error.libraryLock.tooManyTries'), 429);
    }

    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const asked = LibraryUnlockRequestSchema.safeParse(body.success ? body.data : null);

    if (!asked.success || !secretMatches(asked.data.secret, lock.hash)) {
      tries.set(key, { count: (recent?.count ?? 0) + 1, sinceMs: recent?.sinceMs ?? nowMs });

      return context.json(refuse('error.libraryLock.thatIsNotIt'), 403);
    }

    tries.delete(key);

    const untilMs = nowMs + lock.relockMinutes * MINUTE_MS;
    const locks = await locksNow();
    const kept = [
      ...unlockedLibraries(
        cookieOf(context.req.raw.headers, UNLOCKED_COOKIE) ?? '',
        holder,
        locks,
        unlockSecret,
        nowMs,
      ),
    ].filter((one) => one !== libraryId);
    const carried = (cookieOf(context.req.raw.headers, UNLOCKED_COOKIE) ?? '')
      .split(' ')
      .filter((token) => kept.includes(token.split('.')[0] ?? ''));

    setCookie(
      context,
      UNLOCKED_COOKIE,
      [
        ...carried,
        unlockToken({ libraryId, accountId: holder, hash: lock.hash, untilMs }, unlockSecret),
      ].join(' '),
      { path: '/', httpOnly: true, sameSite: 'Lax', maxAge: 24 * 60 * 60 },
    );

    return context.json({ untilMs }, 200);
  });

  app.post('/api/libraries/:libraryId/relock', (context) => {
    const libraryId = context.req.param('libraryId');
    const carried = (cookieOf(context.req.raw.headers, UNLOCKED_COOKIE) ?? '')
      .split(' ')
      .filter((token) => token !== '' && token.split('.')[0] !== libraryId);

    setCookie(context, UNLOCKED_COOKIE, carried.join(' '), {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60,
    });

    return context.json({ isLocked: true }, 200);
  });
};

export { serveLibraryLocks };
