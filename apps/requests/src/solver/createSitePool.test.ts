import { describe, expect, it, vi } from 'vitest';
import { createSitePool } from './createSitePool';

/**
 * An agent that can be kept busy and closed.
 *
 * @returns The agent.
 */
const anAgent = () => {
  let busy = 0;
  let isOpen = true;

  return {
    busy: () => busy,
    isOpen: () => isOpen,
    close: vi.fn(() => {
      isOpen = false;

      return Promise.resolve();
    }),
    work: (delta: number) => {
      busy += delta;
    },
  };
};

type AnAgent = ReturnType<typeof anAgent>;

/**
 * A pool of fake agents, with timers that fire when told to.
 *
 * @param options - What to change about it.
 * @returns The pool, the agents it opened, and what fires its timers.
 */
const aPool = ({ most = 2, upFor = (): number => 0 } = {}) => {
  const opened: AnAgent[] = [];
  const timers: (() => void)[] = [];
  const retire = vi.fn(() => Promise.resolve());
  const pool = createSitePool({
    open: () => {
      const agent = anAgent();

      opened.push(agent);

      return Promise.resolve(agent);
    },
    most,
    idleMs: 60_000,
    restartMs: 3_600_000,
    upFor,
    retire,
    timer: (run) => {
      timers.push(run);

      return () => {
        const at = timers.indexOf(run);

        if (at >= 0) {
          timers.splice(at, 1);
        }
      };
    },
  });

  return {
    pool,
    opened,
    retire,
    fireTimers: async () => {
      for (const run of timers.splice(0)) {
        run();
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
};

/**
 * Does nothing with an agent.
 */
const nothing = (): Promise<void> => Promise.resolve();

describe('createSitePool', () => {
  it('gives a site the same agent each time, and each site its own', async () => {
    const { pool, opened } = aPool();

    const first = await pool.use('site:a', (agent) => Promise.resolve(agent));
    const again = await pool.use('site:a', (agent) => Promise.resolve(agent));
    const other = await pool.use('site:b', (agent) => Promise.resolve(agent));

    expect(first).toBe(again);
    expect(other).not.toBe(first);
    expect(opened).toHaveLength(2);
  });

  it('opens one agent for two requests that arrive together', async () => {
    const { pool, opened } = aPool();

    await Promise.all([pool.use('site:a', nothing), pool.use('site:a', nothing)]);

    expect(opened).toHaveLength(1);
  });

  it('closes the agent used longest ago to make room', async () => {
    const { pool, opened } = aPool({ most: 2 });

    await pool.use('site:a', nothing);
    await pool.use('site:b', nothing);
    await pool.use('site:a', nothing);
    await pool.use('site:c', nothing);

    expect(opened[1]?.close).toHaveBeenCalled();
    expect(pool.has('site:a')).toBe(true);
    expect(pool.has('site:b')).toBe(false);
  });

  it('keeps an agent that is working even when it is the oldest', async () => {
    const { pool, opened } = aPool({ most: 1 });

    await pool.use('site:a', nothing);
    opened[0]?.work(1);
    await pool.use('site:b', nothing);

    expect(opened[0]?.close).not.toHaveBeenCalled();
    expect(pool.has('site:a')).toBe(true);
  });

  it('leaves an agent that is working when its idle time comes', async () => {
    const { pool, opened, fireTimers } = aPool();

    await pool.use('site:a', nothing);
    opened[0]?.work(1);
    await fireTimers();

    expect(opened[0]?.close).not.toHaveBeenCalled();
  });

  it('closes the browser once the last site it was kept for has gone quiet', async () => {
    const { pool, opened, retire, fireTimers } = aPool();

    await pool.use('site:a', nothing);
    await pool.use('site:b', nothing);
    await fireTimers();

    expect(opened[0]?.close).toHaveBeenCalled();
    expect(opened[1]?.close).toHaveBeenCalled();
    expect(retire).toHaveBeenCalledTimes(1);
    expect(pool.has('site:a')).toBe(false);
  });

  it('keeps the browser while another site is still at work', async () => {
    const { pool, opened, retire, fireTimers } = aPool();

    await pool.use('site:a', nothing);
    await pool.use('site:b', nothing);
    opened[1]?.work(1);
    await fireTimers();

    expect(opened[0]?.close).toHaveBeenCalled();
    expect(retire).not.toHaveBeenCalled();
  });

  it('opens a new agent where the old one’s context has gone', async () => {
    const { pool, opened } = aPool();

    await pool.use('site:a', nothing);
    await opened[0]?.close();
    await pool.use('site:a', nothing);

    expect(opened).toHaveLength(2);
  });

  it('retires the browser once it is due and nothing is working', async () => {
    let up = 0;
    const { pool, opened, retire } = aPool({ upFor: () => up });

    await pool.use('site:a', nothing);
    up = 4_000_000;
    await pool.use('site:b', nothing);

    expect(retire).toHaveBeenCalledTimes(1);
    expect(opened[0]?.close).toHaveBeenCalled();
  });

  it('closes everything on the way out', async () => {
    const { pool, opened, retire } = aPool();

    await pool.use('site:a', nothing);
    await pool.closeAll();

    expect(opened[0]?.close).toHaveBeenCalled();
    expect(retire).toHaveBeenCalled();
  });

  it('passes on a task’s failure and carries on', async () => {
    const { pool } = aPool();

    await expect(pool.use('site:a', () => Promise.reject(new Error('no')))).rejects.toThrow('no');
    expect(await pool.use('site:a', () => Promise.resolve('yes'))).toBe('yes');
  });

  it('lets a failed opening go, for the next request to try again', async () => {
    const open = vi
      .fn<() => Promise<AnAgent>>()
      .mockRejectedValueOnce(new Error('no browser'))
      .mockResolvedValue(anAgent());
    const pool = createSitePool({
      open,
      most: 1,
      idleMs: 1,
      restartMs: 1_000_000,
      upFor: () => 0,
      retire: () => Promise.resolve(),
    });

    await expect(pool.use('site:a', nothing)).rejects.toThrow('no browser');
    await pool.use('site:b', nothing);
    await pool.use('site:a', nothing);

    expect(open).toHaveBeenCalledTimes(3);
  });
});
