type Agent = {
  busy(): number;
  isOpen(): boolean;
  close(): Promise<void>;
};

type Timer = (run: () => void, ms: number) => () => void;

type CreateSitePoolOptions<A extends Agent> = {
  open: () => Promise<A>;
  most: number;
  idleMs: number;
  restartMs: number;
  upFor: () => number;
  retire: () => Promise<void>;
  timer?: Timer;
};

type Entry<A> = { agent: Promise<A>; usedAt: number; stopIdling: () => void };

/**
 * Waits in the background without keeping the process alive.
 *
 * @param run - What to do.
 * @param ms - After how long.
 * @returns What cancels it.
 */
const unrefTimer: Timer = (run, ms) => {
  const handle = setTimeout(run, ms);

  handle.unref();

  return () => {
    clearTimeout(handle);
  };
};

/**
 * Keeps an agent for each site being asked for, so that a site's second request starts where its
 * first left off. Only so many are kept: the one used longest ago makes room for a new one, and one
 * left alone long enough closes. Once the last one has closed the browser is retired, so a service
 * with nothing to get past holds no browser at all; and once the browser has been up long enough
 * and nothing is working, everything closes and it is retired too, so that a slow leak in it never
 * becomes a crash.
 *
 * @param open - Opens a new agent.
 * @param most - How many agents may be kept.
 * @param idleMs - How long an agent may sit unused.
 * @param restartMs - How long the browser may run before it is retired.
 * @param upFor - How long the browser has been running.
 * @param retire - Closes the browser, for the next request to launch another.
 * @param timer - How to wait.
 * @returns The pool.
 */
const createSitePool = <A extends Agent>({
  open,
  most,
  idleMs,
  restartMs,
  upFor,
  retire,
  timer = unrefTimer,
}: CreateSitePoolOptions<A>) => {
  const entries = new Map<string, Entry<A>>();
  let working = 0;
  let clock = 0;

  const drop = async (key: string): Promise<void> => {
    const entry = entries.get(key);

    if (entry === undefined) {
      return;
    }

    entries.delete(key);
    entry.stopIdling();
    await entry.agent.then((agent) => agent.close()).catch(() => {});
  };

  const makeRoom = async (): Promise<void> => {
    if (entries.size < most) {
      return;
    }

    const settled = await Promise.all(
      [...entries].map(async ([key, entry]) => ({
        key,
        entry,
        agent: await entry.agent.catch(() => null),
      })),
    );
    const oldest = settled
      .filter(({ agent }) => agent === null || agent.busy() === 0)
      .sort((one, other) => one.entry.usedAt - other.entry.usedAt)[0];

    if (oldest !== undefined) {
      await drop(oldest.key);
    }
  };

  const agentFor = async (key: string): Promise<A> => {
    const found = entries.get(key);

    if (found !== undefined) {
      const agent = await found.agent.catch(() => null);

      if (agent?.isOpen() === true) {
        return agent;
      }

      if (entries.get(key) !== found) {
        return agentFor(key);
      }

      entries.delete(key);
      found.stopIdling();
      void agent?.close();
    }

    const opening = makeRoom().then(open);

    entries.set(key, { agent: opening, usedAt: clock, stopIdling: () => {} });

    return opening;
  };

  const idleAfter = (key: string): void => {
    const entry = entries.get(key);

    if (entry === undefined) {
      return;
    }

    entry.stopIdling();
    entry.stopIdling = timer(() => {
      void entry.agent
        .catch(() => null)
        .then(async (agent) => {
          if (agent !== null && agent.busy() > 0) {
            return;
          }

          const wasTheLast = entries.size === 1 && entries.get(key) === entry;

          await drop(key);

          if (wasTheLast && working === 0) {
            await retire();
          }
        });
    }, idleMs);
  };

  const retireIfDue = async (): Promise<void> => {
    if (working > 0 || upFor() < restartMs) {
      return;
    }

    await Promise.all([...entries.keys()].map(drop));
    await retire();
  };

  const use = async <T>(key: string, task: (agent: A) => Promise<T>): Promise<T> => {
    await retireIfDue();
    working += 1;

    try {
      const agent = await agentFor(key);
      const entry = entries.get(key);

      clock += 1;

      if (entry !== undefined) {
        entry.usedAt = clock;
        entry.stopIdling();
      }

      return await task(agent);
    } finally {
      working -= 1;
      idleAfter(key);
    }
  };

  const has = (key: string): boolean => entries.has(key);

  const closeAll = async (): Promise<void> => {
    await Promise.all([...entries.keys()].map(drop));
    await retire();
  };

  return { use, has, closeAll };
};

type SitePool<A extends Agent> = ReturnType<typeof createSitePool<A>>;

export type { SitePool, Timer };

export { createSitePool };
