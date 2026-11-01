import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execFileSync, hostname } = vi.hoisted(() => ({
  execFileSync: vi.fn<(file: string, args: string[]) => string>(),
  hostname: vi.fn<() => string>(),
}));

vi.mock('node:child_process', () => ({ execFileSync, default: { execFileSync } }));

vi.mock('node:os', () => ({ hostname, default: { hostname } }));

const { theComputersName } = await import('./theComputersName');

beforeEach(() => {
  execFileSync.mockReset();
  hostname.mockReset();
  hostname.mockReturnValue('Dans-MacBook-Pro.local');
});

describe('theComputersName', () => {
  it('names a Mac by the name in its sharing settings', () => {
    execFileSync.mockReturnValue('Dan’s MacBook Pro\n');

    expect(theComputersName('darwin')).toBe('Dan’s MacBook Pro');
    expect(execFileSync).toHaveBeenCalledWith(
      'scutil',
      ['--get', 'ComputerName'],
      expect.objectContaining({ encoding: 'utf8' }),
    );
  });

  it('falls back to a Mac’s network name, without its .local, where it would not say', () => {
    execFileSync.mockImplementation(() => {
      throw new Error('scutil: not found');
    });

    expect(theComputersName('darwin')).toBe('Dans-MacBook-Pro');
  });

  it('falls back to a Mac’s network name where its sharing name is empty', () => {
    execFileSync.mockReturnValue('  \n');

    expect(theComputersName('darwin')).toBe('Dans-MacBook-Pro');
  });

  it('names any other computer by its network name, without asking scutil', () => {
    hostname.mockReturnValue('living-room-pc');

    expect(theComputersName('win32')).toBe('living-room-pc');
    expect(theComputersName('linux')).toBe('living-room-pc');
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('names nothing where the system gives no name', () => {
    hostname.mockReturnValue('');

    expect(theComputersName('linux')).toBeNull();
  });

  it('names nothing where the network name is only .local', () => {
    execFileSync.mockReturnValue('');
    hostname.mockReturnValue('.local');

    expect(theComputersName('darwin')).toBeNull();
  });
});
