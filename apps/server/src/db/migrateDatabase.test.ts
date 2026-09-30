import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { DIALECT } from '#dialect/DIALECT';
import { migrateDatabase } from './migrateDatabase';

const NOWHERE = 'postgres://nobody:nothing@127.0.0.1:1/nowhere';

const MIGRATIONS = join(import.meta.dirname, '..', '..', 'drizzle', DIALECT);

describe('migrateDatabase', () => {
  it('reads the migrations this release carries and refuses them where it may not apply them', async () => {
    const { db, pool } = createDatabase(NOWHERE);
    const lines: string[] = [];

    const plan = await migrateDatabase({
      db,
      databaseUrl: NOWHERE,
      migrations: MIGRATIONS,
      backups: { folder: '/nowhere', keep: 1, isEnabled: false },
      isAllowed: false,
      say: (_level, line) => {
        lines.push(line);
      },
    });

    expect(plan.kind).toBe('refuse');
    expect(plan.kind === 'refuse' && plan.pending).toContain('0000_yummy_rafael_vega');
    expect(lines).toHaveLength(1);

    await pool.end();
  });

  it('stops where the migrations could not be applied', async () => {
    const { db, pool } = createDatabase(NOWHERE);

    await expect(
      migrateDatabase({
        db,
        databaseUrl: NOWHERE,
        migrations: MIGRATIONS,
        backups: { folder: '/nowhere', keep: 1, isEnabled: false },
        isAllowed: true,
        say: () => undefined,
      }),
    ).rejects.toThrow();

    await pool.end();
  });
});
