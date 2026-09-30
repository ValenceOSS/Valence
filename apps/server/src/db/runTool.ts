import { execFile } from 'node:child_process';

/**
 * Runs a command-line tool and waits for it.
 *
 * A tool that is not installed is answered rather than thrown, because a development machine
 * without the postgres client is not broken — it just cannot take a snapshot — and the caller is
 * the one who knows whether that matters.
 *
 * @param command - The program to run.
 * @param args - Its arguments.
 * @param env - Variables to run it with, beside the server's own.
 * @returns Whether it ran, or that it is not installed.
 * @throws If it ran and failed, with what it said.
 */
const runTool = (
  command: string,
  args: readonly string[],
  env: Record<string, string> = {},
): Promise<'ran' | 'missing'> =>
  new Promise((resolve, reject) => {
    execFile(command, [...args], { env: { ...process.env, ...env } }, (error, _output, said) => {
      if (error === null) {
        resolve('ran');

        return;
      }

      if (error.code === 'ENOENT') {
        resolve('missing');

        return;
      }

      reject(new Error(said.trim() === '' ? error.message : said.trim()));
    });
  });

export { runTool };
