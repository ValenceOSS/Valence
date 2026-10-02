import { eq, isNotNull } from 'drizzle-orm';
import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';
import type { MediaImportReportPerson } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';
import { user as userTable } from '#dialect/Schema';
import { deriveUsername } from '@ValenceServer/auth/deriveUsername';
import type { ImportServices } from './ImportServices';
import type { SourceReader, SourceUser } from './SourceReader';

type BroughtAcross = {
  userId: string;
  outcome: NonNullable<MediaImportReportPerson['outcome']>;
};

const ACCOUNT_LINK = 'account';

const TRIES = 5;

/**
 * Whether an account still exists.
 *
 * @param services - What the import works with.
 * @param userId - The account.
 * @returns Whether it is there.
 */
const exists = async (services: ImportServices, userId: string): Promise<boolean> => {
  const [found] = await services.db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return found !== undefined;
};

/**
 * Finds or makes the Valence account for somebody on the old server: the administrator's own where
 * they said it was them, the one an earlier import made, one already holding their address, or a
 * new one nobody can sign in to until its setup link is used, with their picture, administration
 * and whether they were disabled.
 *
 * @param services - What the import works with.
 * @param reader - The source, for their picture.
 * @param sourceId - Which source they come from.
 * @param user - The person on the source.
 * @param context - Whether they are the administrator running the import, and who that is.
 * @param jobId - The job, for recording what went wrong.
 * @returns Their account and how it was found, or null where none could be made.
 */
const bringPersonAcross = async (
  services: ImportServices,
  reader: SourceReader,
  sourceId: string,
  user: SourceUser,
  context: { isYou: boolean; by: string | null; sourceName: string },
  jobId: string,
): Promise<BroughtAcross | null> => {
  const { store, db } = services;

  if (context.isYou && context.by !== null) {
    await store.setLink(sourceId, ACCOUNT_LINK, user.id, context.by);

    return { userId: context.by, outcome: 'you' };
  }

  const remembered = (await store.links(sourceId, ACCOUNT_LINK)).get(user.id);

  if (remembered !== undefined && (await exists(services, remembered))) {
    return { userId: remembered, outcome: 'linked' };
  }

  const email = user.email?.trim().toLowerCase() ?? null;

  if (email !== null && email !== '') {
    const [holder] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (holder !== undefined) {
      await store.setLink(sourceId, ACCOUNT_LINK, user.id, holder.id);

      return { userId: holder.id, outcome: 'linked' };
    }
  }

  if (services.createAccountWithoutPassword === null) {
    services.recordIssue(
      jobId,
      user.name,
      saying('server.imports.bringPersonAcross.accountsCannotBeMadeHere'),
    );

    return null;
  }

  const taken = new Set(
    (
      await db
        .select({ username: userTable.username })
        .from(userTable)
        .where(isNotNull(userTable.username))
    ).flatMap((row) => (row.username === null ? [] : [row.username.toLowerCase()])),
  );
  let withEmail = email !== null && email !== '';
  let made: string | null = null;

  for (let attempt = 0; attempt < TRIES && made === null; attempt += 1) {
    const username = deriveUsername(
      { name: user.username ?? user.name, email: `nobody@${NO_EMAIL_DOMAIN}` },
      taken,
    );
    const outcome = await services.createAccountWithoutPassword({
      name: user.name,
      username,
      ...(withEmail && email !== null ? { email } : {}),
      by: context.by,
    });

    if (outcome.kind === 'created') {
      made = outcome.userId;
    } else if (outcome.kind === 'taken' && outcome.field === 'username') {
      taken.add(username);
    } else if (outcome.kind === 'taken' && outcome.field === 'email') {
      withEmail = false;
    } else {
      break;
    }
  }

  if (made === null) {
    services.recordIssue(
      jobId,
      user.name,
      saying('server.imports.bringPersonAcross.theirAccountCouldNotBeMade'),
    );

    return null;
  }

  await store.setLink(sourceId, ACCOUNT_LINK, user.id, made);

  const profile = await services.profiles.ensureDefault(made, user.name);
  const picture = await reader.avatar(user).catch(() => null);

  if (picture !== null) {
    const fault = await services.profiles.savePhoto(made, profile.id, picture).catch(() => null);

    if (fault !== null) {
      services.recordIssue(
        jobId,
        user.name,
        saying('server.imports.bringPersonAcross.theirPictureCouldNotBeKept'),
      );
    }
  }

  if (user.isAdministrator) {
    await services.grantAdministrator(made);
  }

  if (user.isDisabled) {
    await services.banAccount(
      made,
      say('server.imports.bringPersonAcross.disabledOnSource', { source: context.sourceName }),
    );
  }

  return { userId: made, outcome: 'created' };
};

export type { BroughtAcross };

export { bringPersonAcross };
