import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { awaitTool } from '@ValenceServer/db/awaitTool';
import type { ToolRun } from '@ValenceServer/db/ToolRun';

/**
 * Runs a command-line tool and gzips what it prints into a file, for a tool such as `mariadb-dump`
 * that writes to its output rather than to a file of its own.
 *
 * A tool that is not installed is answered rather than thrown, as `runTool` answers it. A tool that
 * fails leaves no file behind, so a half-written copy is never mistaken for a way back.
 *
 * @param command - The program to run.
 * @param args - Its arguments.
 * @param env - Variables to add to its environment, such as a password kept off its command line.
 * @param file - Where to write what it prints.
 * @returns Whether it ran, or that it is not installed.
 * @throws If it ran and failed, with what it said.
 */
const runToolInto = async ({
  command,
  args,
  env = {},
  file,
}: ToolRun): Promise<'ran' | 'missing'> => {
  const child = spawn(command, [...args], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = awaitTool(child, command);

  try {
    const [outcome] = await Promise.all([
      exited,
      pipeline(child.stdout, createGzip(), createWriteStream(file)),
    ]);

    if (outcome === 'missing') {
      await rm(file, { force: true });
    }

    return outcome;
  } catch (problem) {
    await rm(file, { force: true });

    throw problem;
  }
};

export { runToolInto };
