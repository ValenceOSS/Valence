import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'mysql2/promise';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createScratchDatabase } from '@ValenceDatabase/mysql/createScratchDatabase';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/mysql/', import.meta.url));

const MIGRATING_MS = 120_000;

const MERGING = '0036_one_person_accounts';

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

const drops: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const drop of drops.splice(0)) {
    await drop();
  }
});

/**
 * Runs every statement of one migration file.
 *
 * @param connection - Where to run it.
 * @param tag - Which migration.
 */
const run = async (
  connection: Awaited<ReturnType<typeof createConnection>>,
  tag: string,
): Promise<void> => {
  const statements = (await readFile(`${MIGRATIONS}${tag}.sql`, 'utf8'))
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '');

  for (const statement of statements) {
    await connection.query(statement);
  }
};

/**
 * Brings a database up to just before accounts one person watches on became that person, with
 * accounts set up the ways servers really hold them, then runs the change and reads both tables.
 *
 * @returns Each account's owner profile and its own choices.
 */
const aDatabaseMerged = async () => {
  const { url, drop } = await createScratchDatabase();

  drops.push(drop);

  const connection = await createConnection(url);

  try {
    const journal = JournalSchema.parse(
      JSON.parse(await readFile(`${MIGRATIONS}meta/_journal.json`, 'utf8')),
    );
    const tags = journal.entries.map((entry) => entry.tag);

    for (const tag of tags.slice(0, tags.indexOf(MERGING))) {
      await run(connection, tag);
    }

    await connection.query(`INSERT INTO \`user\` (\`id\`, \`name\`, \`email\`) VALUES
      ('katie', 'Katie', 'katie@valence.local'),
      ('dan', 'Dan', 'dan@valence.local'),
      ('family', 'Morgan', 'family@valence.local')`);
    await connection.query(`INSERT INTO \`user_profile\` (\`userId\`, \`displayName\`, \`photoPath\`) VALUES
      ('katie', 'Katie', 'household-katie.webp'),
      ('dan', 'Dan', NULL),
      ('family', 'The Morgans', 'household-family.webp')`);
    await connection.query(`INSERT INTO \`viewer_profile\` (\`id\`, \`userId\`, \`name\`, \`colour\`, \`photoPath\`, \`avatarLook\`, \`isOwner\`) VALUES
      ('p-katie', 'katie', 'Katie', '#e8503a', NULL, '{"kind":"initial","font":"${PLUS_JAKARTA_SANS_AS_STORED}"}', true),
      ('p-dan', 'dan', 'Dan', '#8b5ce8', 'p-dan.webp', '{"kind":"photo","isVideo":false,"frame":null}', true),
      ('p-mum', 'family', 'Mum', '#e8503a', NULL, NULL, true),
      ('p-kid', 'family', 'Kid', '#e8503a', NULL, NULL, false)`);

    await run(connection, MERGING);

    const [profileRows] = await connection.query(
      'SELECT `userId`, `photoPath`, `avatarStyle`, `avatarLook` FROM `viewer_profile` WHERE `isOwner`',
    );
    const [householdRows] = await connection.query(
      'SELECT `userId`, `displayName`, `photoPath`, `avatarStyle` FROM `user_profile`',
    );
    const profiles = ProfileRowSchema.parse(profileRows);
    const households = HouseholdRowSchema.parse(householdRows);

    return {
      profileOf: (userId: string) => profiles.find((row) => row.userId === userId),
      householdOf: (userId: string) => households.find((row) => row.userId === userId),
    };
  } finally {
    await connection.end();
  }
};

describe('accounts one person watches on, as an update finds them', () => {
  it(
    'moves the account’s picture onto its one profile, keeps a profile’s own, and leaves families be',
    async () => {
      const { profileOf, householdOf } = await aDatabaseMerged();

      expect(profileOf('katie')).toMatchObject({
        photoPath: 'household-katie.webp',
        avatarLook: null,
      });
      expect(householdOf('katie')).toMatchObject({ displayName: null, photoPath: null });
      expect(profileOf('dan')).toMatchObject({ photoPath: 'p-dan.webp' });
      expect(householdOf('dan')).toMatchObject({ displayName: null });
      expect(householdOf('family')).toMatchObject({
        displayName: 'The Morgans',
        photoPath: 'household-family.webp',
      });
      expect(profileOf('family')).toMatchObject({ photoPath: null });
    },
    MIGRATING_MS,
  );
});
