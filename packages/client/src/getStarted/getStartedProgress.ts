import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.getStarted';

const ProgressSchema = z.object({
  done: z.array(z.string()).default([]),
  skipped: z.array(z.string()).default([]),
  isDismissed: z.boolean().default(false),
  isCollapsed: z.boolean().default(false),
});

const EveryoneSchema = z.record(z.string(), ProgressSchema);

type GetStartedProgress = z.infer<typeof ProgressSchema>;

const NOTHING_YET: GetStartedProgress = {
  done: [],
  skipped: [],
  isDismissed: false,
  isCollapsed: false,
};

/**
 * Reads every account's progress through getting started on this device, or nothing where none is
 * kept or what is kept cannot be read.
 *
 * @returns Each account's progress, by account.
 */
const readEveryone = (): Record<string, GetStartedProgress> => {
  try {
    const kept = platformInUse().store.read(STORAGE_KEY);
    const parsed = EveryoneSchema.safeParse(kept === null ? {} : JSON.parse(kept));

    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
};

/**
 * How far an account has got through getting started on this device: which steps it has done or
 * skipped, and whether it put the list away or folded it up.
 *
 * @param accountId - Whose progress.
 * @returns The progress, nothing done where none is kept.
 */
const readGetStartedProgress = (accountId: string): GetStartedProgress =>
  readEveryone()[accountId] ?? NOTHING_YET;

/**
 * Remembers a change to how far an account has got through getting started on this device.
 *
 * @param accountId - Whose progress.
 * @param change - What changed.
 * @returns The progress as it now stands.
 */
const saveGetStartedProgress = (
  accountId: string,
  change: Partial<GetStartedProgress>,
): GetStartedProgress => {
  const everyone = readEveryone();
  const next = { ...(everyone[accountId] ?? NOTHING_YET), ...change };

  try {
    platformInUse().store.write(STORAGE_KEY, JSON.stringify({ ...everyone, [accountId]: next }));
  } catch {}

  return next;
};

export type { GetStartedProgress };

export { readGetStartedProgress, saveGetStartedProgress };
