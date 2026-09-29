import { describe, expect, it, vi } from 'vitest';

const { execFileSync } = vi.hoisted(() => ({
  execFileSync: vi.fn<(command: string, args: string[]) => Buffer>(),
}));

vi.mock('node:child_process', () => ({ execFileSync }));

const { commitThisIsRunning } = await import('./commitThisIsRunning');

describe('commitThisIsRunning', () => {
  it('reads the commit off the checkout the server started in', () => {
    execFileSync.mockReturnValue(Buffer.from('e68dd35\n'));

    expect(commitThisIsRunning()).toBe('e68dd35');
    expect(execFileSync.mock.calls[0]?.slice(0, 2)).toEqual([
      'git',
      ['rev-parse', '--short', 'HEAD'],
    ]);
  });

  it('says unknown where there is no checkout to read', () => {
    execFileSync.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    expect(commitThisIsRunning()).toBe('unknown');
  });
});
