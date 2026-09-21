import { describe, expect, it, vi } from 'vitest';
import { migrateToLatest } from './migrateToLatest';

const said = () => {
  const lines: { level: string; line: string }[] = [];

  return {
    lines,
    say: (level: 'info' | 'error', line: string) => {
      lines.push({ level, line });
    },
  };
};

describe('migrateToLatest', () => {
  it('runs nothing against a database that is already in step', async () => {
    const apply = vi.fn(() => Promise.resolve());
    const reporter = said();

    const plan = await migrateToLatest({
      pending: () => Promise.resolve([]),
      apply,
      isAllowed: true,
      say: reporter.say,
    });

    expect(plan.kind).toBe('inStep');
    expect(apply).not.toHaveBeenCalled();
  });

  it('says nothing at all about a database in step, which is the ordinary start', async () => {
    const reporter = said();

    await migrateToLatest({
      pending: () => Promise.resolve([]),
      apply: () => Promise.resolve(),
      isAllowed: true,
      say: reporter.say,
    });

    expect(reporter.lines).toStrictEqual([]);
  });

  it('applies what is pending', async () => {
    const apply = vi.fn(() => Promise.resolve());

    await migrateToLatest({
      pending: () => Promise.resolve(['0049_jwks']),
      apply,
      isAllowed: true,
      say: said().say,
    });

    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('names them before running them, so a migration that hangs says which', async () => {
    const reporter = said();
    const order: string[] = [];

    await migrateToLatest({
      pending: () => Promise.resolve(['0049_jwks']),
      apply: () => {
        order.push('applied');

        return Promise.resolve();
      },
      isAllowed: true,
      say: (level, line) => {
        order.push('said');
        reporter.say(level, line);
      },
    });

    expect(order).toStrictEqual(['said', 'applied', 'said']);
    expect(reporter.lines[0]?.line).toContain('0049_jwks');
  });

  it('leaves them alone and says so loudly when an operator opted out', async () => {
    const apply = vi.fn(() => Promise.resolve());
    const reporter = said();

    const plan = await migrateToLatest({
      pending: () => Promise.resolve(['0049_jwks']),
      apply,
      isAllowed: false,
      say: reporter.say,
    });

    expect(plan.kind).toBe('refuse');
    expect(apply).not.toHaveBeenCalled();
    expect(reporter.lines[0]?.level).toBe('error');
  });

  it('refuses to come up quietly when the migration itself fails', async () => {
    await expect(
      migrateToLatest({
        pending: () => Promise.resolve(['0049_jwks']),
        apply: () => Promise.reject(new Error('relation "jwks" is locked')),
        isAllowed: true,
        say: said().say,
      }),
    ).rejects.toThrow('relation "jwks" is locked');
  });

  it('does not claim the database is up to date when applying threw', async () => {
    const reporter = said();

    await migrateToLatest({
      pending: () => Promise.resolve(['0049_jwks']),
      apply: () => Promise.reject(new Error('nope')),
      isAllowed: true,
      say: reporter.say,
    }).catch(() => undefined);

    expect(reporter.lines.some((one) => one.line.includes('up to date'))).toBe(false);
  });

  it('applies what drizzle skipped, once drizzle has run and left something pending', async () => {
    const reporter = said();
    const pending = vi
      .fn<() => Promise<readonly string[]>>()
      .mockResolvedValueOnce(['0069_a', '0070_b'])
      .mockResolvedValueOnce(['0070_b'])
      .mockResolvedValueOnce([]);
    const applyMissed = vi.fn(() => Promise.resolve(['0070_b']));

    await migrateToLatest({
      pending,
      apply: () => Promise.resolve(),
      applyMissed,
      isAllowed: true,
      say: reporter.say,
    });

    expect(applyMissed).toHaveBeenCalledTimes(1);
    expect(reporter.lines.map((one) => one.line).join('\n')).toContain('Drizzle skipped 1');
    expect(reporter.lines.at(-1)?.line).toBe('The database is up to date with this release.');
  });

  it('leaves the skipped ones alone when drizzle ran everything', async () => {
    const applyMissed = vi.fn(() => Promise.resolve([]));
    const pending = vi
      .fn<() => Promise<readonly string[]>>()
      .mockResolvedValueOnce(['0049_jwks'])
      .mockResolvedValueOnce([]);

    await migrateToLatest({
      pending,
      apply: () => Promise.resolve(),
      applyMissed,
      isAllowed: true,
      say: said().say,
    });

    expect(applyMissed).not.toHaveBeenCalled();
  });

  it('refuses to come up while migrations are still missing after everything has been tried', async () => {
    await expect(
      migrateToLatest({
        pending: () => Promise.resolve(['0070_b']),
        apply: () => Promise.resolve(),
        applyMissed: () => Promise.resolve([]),
        isAllowed: true,
        say: said().say,
      }),
    ).rejects.toThrow('0070_b');
  });

  it('takes its way back before the first migration runs', async () => {
    const order: string[] = [];

    await migrateToLatest({
      pending: () => Promise.resolve(['0001_a']),
      beforeApply: () => {
        order.push('snapshot');

        return Promise.resolve();
      },
      apply: () => {
        order.push('apply');

        return Promise.resolve();
      },
      isAllowed: true,
      say: said().say,
    });

    expect(order).toEqual(['snapshot', 'apply']);
  });

  it('does not migrate when the way back could not be kept', async () => {
    const apply = vi.fn(() => Promise.resolve());

    await expect(
      migrateToLatest({
        pending: () => Promise.resolve(['0001_a']),
        beforeApply: () => Promise.reject(new Error('disk full')),
        apply,
        isAllowed: true,
        say: said().say,
      }),
    ).rejects.toThrow('disk full');
    expect(apply).not.toHaveBeenCalled();
  });

  it('refuses to start over a database a newer release has migrated', async () => {
    const apply = vi.fn(() => Promise.resolve());

    await expect(
      migrateToLatest({
        pending: () => Promise.resolve([]),
        newer: () => Promise.resolve([9]),
        apply,
        isAllowed: true,
        say: said().say,
      }),
    ).rejects.toThrow('a newer Valence has used it');
    expect(apply).not.toHaveBeenCalled();
  });
});
