import { describe, expect, it, vi } from 'vitest';
import { becomeTheUser } from './becomeTheUser';

/**
 * A process started as the user given, recording what it is told to become.
 *
 * @param startedAs - The user id it started as.
 * @returns The process.
 */
const aProcess = (startedAs: number) => ({
  getuid: () => startedAs,
  setgroups: vi.fn(),
  setgid: vi.fn(),
  setuid: vi.fn(),
  env: { HOME: '/root' } satisfies Record<string, string | undefined>,
});

describe('becomeTheUser', () => {
  it('stops being root, group first, and gives the user somewhere to call home', () => {
    const running = aProcess(0);

    expect(becomeTheUser({ uid: 1000, gid: 1001 }, running)).toBe('became');
    expect(running.setgroups).toHaveBeenCalledWith([1001]);
    expect(running.setgid).toHaveBeenCalledWith(1001);
    expect(running.setuid).toHaveBeenCalledWith(1000);
    expect(running.setgid.mock.invocationCallOrder[0]).toBeLessThan(
      running.setuid.mock.invocationCallOrder[0] ?? 0,
    );
    expect(running.env.HOME).toBe('/tmp');
  });

  it('stays root where it is asked to', () => {
    const running = aProcess(0);

    expect(becomeTheUser({ uid: 0, gid: 0 }, running)).toBe('stayedRoot');
    expect(running.setuid).not.toHaveBeenCalled();
  });

  it('leaves a service already started as somebody else as it is', () => {
    const running = aProcess(501);

    expect(becomeTheUser({ uid: 1000, gid: 1000 }, running)).toBe('alreadyNotRoot');
    expect(running.setuid).not.toHaveBeenCalled();
  });

  it('leaves a system with no users of this kind as it is', () => {
    expect(becomeTheUser({ uid: 1000, gid: 1000 }, { env: {} })).toBe('alreadyNotRoot');
  });
});
