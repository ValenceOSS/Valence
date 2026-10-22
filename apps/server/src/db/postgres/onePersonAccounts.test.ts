import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/postgres/', import.meta.url));

const STARTING_POSTGRES_MS = 60_000;

const MERGING = '0129_one_person_accounts';

const JournalSchema = z.object({ entries: z.array(z.object({ tag: z.string() })) });

const ProfileRowSchema = z.array(
  z.object({
    userId: z.string(),
    photoPath: z.string().nullable(),
    avatarStyle: z.string().nullable(),
    avatarLook: z.object({ kind: z.string() }).nullable(),
  }),
);

const HouseholdRowSchema = z.array(
  z.object({
    userId: z.string(),
    displayName: z.string().nullable(),
    photoPath: z.string().nullable(),
    avatarStyle: z.string().nullable(),
  }),
);

/**
 * Brings a database up to just before accounts one person watches on became that person, with
 * accounts set up the ways servers really hold them, then runs the change.
 *
 * @returns The database, changed.
 */
const aDatabaseMerged = async (): Promise<PGlite> => {
  const client = new PGlite();
  const journal = JournalSchema.parse(
    JSON.parse(await readFile(`${MIGRATIONS}meta/_journal.json`, 'utf8')),
  );
  const tags = journal.entries.map((entry) => entry.tag);

  for (const tag of tags.slice(0, tags.indexOf(MERGING))) {
    await client.exec(await readFile(`${MIGRATIONS}${tag}.sql`, 'utf8'));
  }

  await client.exec(`
    INSERT INTO "user" ("id", "name", "email") VALUES
      ('katie', 'Katie', 'katie@valence.local'),
      ('dan', 'Dan', 'dan@valence.local'),
      ('jai', 'Jai', 'jai@valence.local'),
      ('family', 'Morgan', 'family@valence.local');
    INSERT INTO "user_profile" ("userId", "displayName", "photoPath", "avatarStyle", "avatarSeed") VALUES
      ('katie', 'Katie', 'household-katie.webp', NULL, NULL),
      ('dan', 'Dan', NULL, NULL, NULL),
      ('jai', NULL, NULL, 'bottts', 'jai'),
      ('family', 'The Morgans', 'household-family.webp', NULL, NULL);
    INSERT INTO "viewer_profile" ("id", "userId", "name", "colour", "photoPath", "avatarLook", "isOwner") VALUES
      ('p-katie', 'katie', 'Katie', '#e8503a', NULL, '{"kind":"initial","font":"${PLUS_JAKARTA_SANS_AS_STORED}"}', true),
      ('p-dan', 'dan', 'Dan', '#8b5ce8', 'p-dan.webp', '{"kind":"photo","isVideo":false,"frame":null}', true),
      ('p-jai', 'jai', 'Jai', '#360c99', NULL, NULL, true),
      ('p-mum', 'family', 'Mum', '#e8503a', NULL, NULL, true),
      ('p-kid', 'family', 'Kid', '#e8503a', NULL, NULL, false);
  `);

  await client.exec(await readFile(`${MIGRATIONS}${MERGING}.sql`, 'utf8'));

  return client;
};

/**
 * Reads every profile and every household, by account.
 *
 * @param client - The database.
 * @returns Both, keyed by account.
 */
const readBoth = async (client: PGlite) => {
  const profiles = ProfileRowSchema.parse(
    (
      await client.query(
        'SELECT "userId", "photoPath", "avatarStyle", "avatarLook" FROM "viewer_profile" WHERE "isOwner"',
      )
    ).rows,
  );
  const households = HouseholdRowSchema.parse(
    (
      await client.query(
        'SELECT "userId", "displayName", "photoPath", "avatarStyle" FROM "user_profile"',
      )
    ).rows,
  );

  return {
    profileOf: (userId: string) => profiles.find((row) => row.userId === userId),
    householdOf: (userId: string) => households.find((row) => row.userId === userId),
  };
};

describe('accounts one person watches on, as an update finds them', () => {
  it(
    'moves a picture the account was given onto its one profile, where that had none',
    async () => {
      const { profileOf, householdOf } = await readBoth(await aDatabaseMerged());

      expect(profileOf('katie')).toMatchObject({
        photoPath: 'household-katie.webp',
        avatarLook: null,
      });
      expect(profileOf('jai')).toMatchObject({ photoPath: null, avatarStyle: 'bottts' });
      expect(householdOf('katie')).toMatchObject({ displayName: null, photoPath: null });
      expect(householdOf('jai')).toMatchObject({ avatarStyle: null });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the profile’s own picture, and drops what the account chose beside it',
    async () => {
      const { profileOf, householdOf } = await readBoth(await aDatabaseMerged());

      expect(profileOf('dan')).toMatchObject({
        photoPath: 'p-dan.webp',
        avatarLook: { kind: 'photo' },
      });
      expect(householdOf('dan')).toMatchObject({ displayName: null });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'leaves an account several people watch on exactly as it was',
    async () => {
      const { profileOf, householdOf } = await readBoth(await aDatabaseMerged());

      expect(householdOf('family')).toMatchObject({
        displayName: 'The Morgans',
        photoPath: 'household-family.webp',
      });
      expect(profileOf('family')).toMatchObject({ photoPath: null });
    },
    STARTING_POSTGRES_MS,
  );
});
