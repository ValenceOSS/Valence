import { describe, expect, it, vi } from 'vitest';
import { runTool } from '@ValenceServer/db/runTool';

const child = vi.hoisted(() => ({ execFile: vi.fn() }));

vi.mock('node:child_process', () => child);

describe('runTool', () => {
  it('says it ran', async () => {
    child.execFile.mockImplementation(
      (_c: string, _a: string[], _o: object, done: (e: null) => void) => {
        done(null);
      },
    );

    await expect(runTool('pg_dump', ['--version'])).resolves.toBe('ran');
  });

  it('says a tool that is not installed is missing rather than failing', async () => {
    child.execFile.mockImplementation(
      (
        _c: string,
        _a: string[],
        _o: object,
        done: (e: { code: string; message: string }) => void,
      ) => {
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
        _o: object,
        done: (e: { code: number; message: string }, o: string, s: string) => void,
      ) => {
        done({ code: 1, message: 'exit 1' }, '', 'connection refused\n');
      },
    );

    await expect(runTool('pg_dump', [])).rejects.toThrow('connection refused');
  });

  it("runs the tool with the variables it was given beside the server's own", async () => {
    let seen: { env?: NodeJS.ProcessEnv } = {};

    child.execFile.mockImplementation(
      (_c: string, _a: string[], options: { env?: NodeJS.ProcessEnv }, done: (e: null) => void) => {
        seen = options;
        done(null);
      },
    );

    await runTool('pg_dump', [], { PGSSLMODE: 'require' });

    expect(seen.env?.PGSSLMODE).toBe('require');
    expect(seen.env?.PATH).toBe(process.env.PATH);
  });
});
