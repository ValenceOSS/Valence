import { describe, expect, it, vi } from 'vitest';
import { runTool } from '@ValenceServer/db/runTool';

const child = vi.hoisted(() => ({ execFile: vi.fn() }));

vi.mock('node:child_process', () => child);

describe('runTool', () => {
  it('says it ran', async () => {
    child.execFile.mockImplementation((_c: string, _a: string[], done: (e: null) => void) => {
      done(null);
    });

    await expect(runTool('pg_dump', ['--version'])).resolves.toBe('ran');
  });

  it('says a tool that is not installed is missing rather than failing', async () => {
    child.execFile.mockImplementation(
      (_c: string, _a: string[], done: (e: { code: string; message: string }) => void) => {
        done({ code: 'ENOENT', message: 'spawn pg_dump ENOENT' });
      },
    );

    await expect(runTool('pg_dump', [])).resolves.toBe('missing');
  });

  it('fails with what the tool said', async () => {
    child.execFile.mockImplementation(
      (
        _c: string,
        _a: string[],
        done: (e: { code: number; message: string }, o: string, s: string) => void,
      ) => {
        done({ code: 1, message: 'exit 1' }, '', 'connection refused\n');
      },
    );

    await expect(runTool('pg_dump', [])).rejects.toThrow('connection refused');
  });
});
