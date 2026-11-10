import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { upsert } from '@ValenceDatabase/upsert';
import { serverSetting } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { JobPauses, JobPauseStore } from '@ValenceServer/jobs/JobPauseStore';

const PAUSES_KEY = 'jobPauses';

const NOTHING_PAUSED: JobPauses = { isEverythingPaused: false, jobIds: [] };

const JobPausesSchema = z.object({
  isEverythingPaused: z.boolean().catch(false),
  jobIds: z.array(z.string()).catch([]),
});

/**
 * Keeps which jobs are paused, and whether everything is, in the server's settings, so a pause
 * outlasts a restart.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseJobPauseStore = (db: AnyValenceDatabase): JobPauseStore => ({
  read: async () => {
    const [row] = await db
      .select()
      .from(serverSetting)
      .where(eq(serverSetting.key, PAUSES_KEY))
      .limit(1);
    const read = JobPausesSchema.safeParse(row?.value);

    return read.success ? read.data : NOTHING_PAUSED;
  },

  write: async (pauses) => {
    await upsert(db, serverSetting, {
      values: [{ key: PAUSES_KEY, value: pauses, updatedAt: new Date() }],
      target: serverSetting.key,
      set: { value: pauses, updatedAt: new Date() },
    });
  },
});

export { createDatabaseJobPauseStore };
