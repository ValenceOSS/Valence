import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { awaitTool } from '@ValenceServer/db/awaitTool';
import type { ToolRun } from '@ValenceServer/db/ToolRun';

/**
 * Runs a command-line tool with a gzipped file unpacked into its input, for a tool such as
 * `mariadb` that reads what to run from there.
 *
 * @param command - The program to run.
 * @param args - Its arguments.
 * @param env - Variables to add to its environment, such as a password kept off its command line.
 * @param file - The gzipped file to feed it.
 * @returns Whether it ran, or that it is not installed.
 * @throws If it ran and failed, with what it said.
 */
const runToolFrom = async ({
  command,
  args,
  env = {},
  file,
}: ToolRun): Promise<'ran' | 'missing'> => {
  const child = spawn(command, [...args], {
    env: { ...process.env, ...env },
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  const exited = awaitTool(child, command);

  const fed = pipeline(createReadStream(file), createGunzip(), child.stdin).catch(() => null);
  const outcome = await exited;

  await fed;

  return outcome;
};

export { runToolFrom };
