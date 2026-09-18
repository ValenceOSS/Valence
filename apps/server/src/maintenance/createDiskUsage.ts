type DiskUsage = {
  count: number;
  bytes: number;
  atMs: number;
};

type CreateDiskUsageOptions = {
  measure: () => Promise<Omit<DiskUsage, 'atMs'>>;
  everyMs?: number;
};

const HOUR = 60 * 60 * 1000;

/**
 * Keeps a count of how much disk something Valence keeps is taking, for the storage figures an
 * operator reads before deciding whether to sweep it. The last count is held so a reader never waits
 * on a disk, and is taken again on a timer and whenever somebody asks for it fresh.
 *
 * @param options - How to count, and how often to count again on its own.
 * @returns A way to read the last count, count again now, and keep counting.
 */
const createDiskUsage = ({ measure, everyMs = HOUR }: CreateDiskUsageOptions) => {
  let last: DiskUsage | null = null;

  const counted = async (): Promise<DiskUsage> => ({ ...(await measure()), atMs: Date.now() });

  return {
    read: (): DiskUsage | null => last,

    refresh: async (): Promise<DiskUsage> => {
      last = await counted();

      return last;
    },

    watch: (): (() => void) => {
      const timer = setInterval(() => {
        void counted().then((usage) => {
          last = usage;
        });
      }, everyMs);

      timer.unref();

      return () => {
        clearInterval(timer);
      };
    },
  };
};

export type { DiskUsage };

export { createDiskUsage };
