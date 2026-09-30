import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createScratchDatabase } from '@ValenceDatabase/mysql/createScratchDatabase';
import { openPool } from './openPool';

const SessionSchema = z.tuple([
  z.array(z.object({ zone: z.string(), mode: z.string(), document: z.string() })),
  z.array(z.object({})),
]);

describe('openPool', () => {
  it('runs every connection in UTC and in strict mode, and hands JSON back as text', async () => {
    const scratch = await createScratchDatabase();
    const pool = openPool(scratch.url, { poolMax: 2, tls: { mode: 'off', ca: null } });

    try {
      const [[session]] = SessionSchema.parse(
        await pool.query(
          "select @@session.time_zone as zone, @@session.sql_mode as mode, json_object('a', 1) as document",
        ),
      );

      expect(session?.zone).toBe('+00:00');
      expect(session?.mode).toContain('STRICT_ALL_TABLES');
      expect(session?.mode).toContain('ONLY_FULL_GROUP_BY');
      expect(JSON.parse(session?.document ?? '')).toEqual({ a: 1 });
    } finally {
      await pool.end();
      await scratch.drop();
    }
  });
});
