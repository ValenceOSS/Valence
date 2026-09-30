import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/postgres/', import.meta.url));

const STARTING_POSTGRES_MS = 60_000;

const MOVING_OFF = '0092_job_queue';

const JournalSchema = z.object({ entries: z.array(z.object({ tag: z.string() })) });

const CarriedSchema = z.array(
  z.object({
    id: z.string(),
    kind: z.string(),
    subject: z.string().nullable(),
    waitingKey: z.string().nullable(),
    attempts: z.number(),
    payload: z.record(z.string(), z.string()),
  }),
);

/**
 * Brings a database up to just before the queue moved off pg-boss, with pg-boss's job table as
 * version 12 left it and some work in it, then runs the move.
 *
 * @returns The database, moved.
 */
const aDatabaseMovedOffPgBoss = async (): Promise<PGlite> => {
  const client = new PGlite();
  const journal = JournalSchema.parse(
    JSON.parse(await readFile(`${MIGRATIONS}meta/_journal.json`, 'utf8')),
  );
  const tags = journal.entries.map((entry) => entry.tag);

  for (const tag of tags.slice(0, tags.indexOf(MOVING_OFF))) {
    await client.exec(await readFile(`${MIGRATIONS}${tag}.sql`, 'utf8'));
  }

  await client.exec(`
    CREATE SCHEMA valence_jobs;
    CREATE TYPE valence_jobs.job_state AS ENUM ('created', 'retry', 'active', 'completed', 'cancelled', 'failed');
    CREATE TABLE valence_jobs.job (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      data jsonb,
      state valence_jobs.job_state NOT NULL,
      retry_limit integer NOT NULL,
      retry_count integer NOT NULL,
      singleton_key text,
      start_after timestamp with time zone NOT NULL,
      created_on timestamp with time zone NOT NULL
    );
    INSERT INTO valence_jobs.job VALUES
      ('00000000-0000-4000-8000-000000000001', 'library.scan', '{"libraryId":"films"}', 'created', 2, 0, 'films', now(), now()),
      ('00000000-0000-4000-8000-000000000002', 'server.prepareDownload', '{"subject":"Arrival"}', 'retry', 0, 1, null, now(), now()),
      ('00000000-0000-4000-8000-000000000003', 'library.scan', '{"libraryId":"shows"}', 'active', 2, 0, null, now(), now()),
      ('00000000-0000-4000-8000-000000000004', 'library.scan', '{"libraryId":"music"}', 'completed', 2, 0, null, now(), now()),
      ('00000000-0000-4000-8000-000000000005', 'library.scan.scheduled', null, 'created', 2, 0, 'library.scan.scheduled', now(), now());
  `);

  await client.exec(await readFile(`${MIGRATIONS}${MOVING_OFF}.sql`, 'utf8'));

  return client;
};

describe('moving the queue off pg-boss', () => {
  it(
    'carries across the work that was waiting, and nothing that had started, ended or fires on a clock',
    async () => {
      const client = await aDatabaseMovedOffPgBoss();
      const { rows } = await client.query(
        'select id, kind, subject, "waitingKey", attempts, payload from queued_job order by id',
      );

      expect(CarriedSchema.parse(rows)).toEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          kind: 'library.scan',
          subject: 'films',
          waitingKey: 'films',
          attempts: 0,
          payload: { libraryId: 'films' },
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          kind: 'server.prepareDownload',
          subject: 'Arrival',
          waitingKey: null,
          attempts: 1,
          payload: { subject: 'Arrival' },
        },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'leaves pg-boss where it was, so the version before this can still be gone back to',
    async () => {
      const client = await aDatabaseMovedOffPgBoss();
      const { rows } = await client.query('select count(*)::int as left from valence_jobs.job');

      expect(rows).toEqual([{ left: 5 }]);
    },
    STARTING_POSTGRES_MS,
  );
});
