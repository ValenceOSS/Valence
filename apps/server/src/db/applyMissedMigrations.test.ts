import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { applyMissedMigrations } from './applyMissedMigrations';
import type { MissedMigration } from './applyMissedMigrations';

const JOURNAL = JSON.stringify({
  entries: [
    { tag: '0001_first', when: 100 },
    { tag: '0002_second', when: 300 },
    { tag: '0003_third', when: 200 },
  ],
});

const SQL: Record<string, string> = {
  '0001_first': 'CREATE TABLE a (id text);',
  '0002_second':
    'ALTER TABLE a ADD COLUMN b text;--> statement-breakpoint\nCREATE INDEX a_b ON a (b);',
  '0003_third': 'ALTER TABLE a ADD COLUMN c text;',
};

const run = async (applied: number[]) => {
  const applyOne = vi.fn<(migration: MissedMigration) => Promise<void>>(() => Promise.resolve());

  const tags = await applyMissedMigrations({
    readJournal: () => Promise.resolve(JOURNAL),
    readAppliedAt: () => Promise.resolve(applied),
    readSql: (tag) => Promise.resolve(SQL[tag] ?? ''),
    applyOne,
  });

  return { tags, applyOne };
};

describe('applyMissedMigrations', () => {
  it('applies nothing to a database that has run everything', async () => {
    const { tags, applyOne } = await run([100, 300, 200]);

    expect(tags).toEqual([]);
    expect(applyOne).not.toHaveBeenCalled();
  });

  it('applies a migration whose stamp is older than one already run, which drizzle would skip', async () => {
    const { tags } = await run([100, 300]);

    expect(tags).toEqual(['0003_third']);
  });

  it('applies them in the journal order rather than by stamp', async () => {
    const { tags } = await run([]);

    expect(tags).toEqual(['0001_first', '0002_second', '0003_third']);
  });

  it('splits a migration into its statements at the breakpoints', async () => {
    const { applyOne } = await run([100, 200]);

    expect(applyOne).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: '0002_second',
        statements: ['ALTER TABLE a ADD COLUMN b text;', 'CREATE INDEX a_b ON a (b);'],
      }),
    );
  });

  it('records each under the stamp and hash drizzle would have written', async () => {
    const { applyOne } = await run([100, 300]);

    expect(applyOne).toHaveBeenCalledWith(
      expect.objectContaining({
        when: 200,
        hash: createHash('sha256')
          .update(SQL['0003_third'] ?? '')
          .digest('hex'),
      }),
    );
  });

  it('stops at the migration that failed, leaving the later ones for another attempt', async () => {
    const applyOne = vi.fn((migration: MissedMigration) =>
      migration.tag === '0002_second' ? Promise.reject(new Error('boom')) : Promise.resolve(),
    );

    await expect(
      applyMissedMigrations({
        readJournal: () => Promise.resolve(JOURNAL),
        readAppliedAt: () => Promise.resolve([]),
        readSql: (tag) => Promise.resolve(SQL[tag] ?? ''),
        applyOne,
      }),
    ).rejects.toThrow('boom');

    expect(applyOne).toHaveBeenCalledTimes(2);
  });
});
