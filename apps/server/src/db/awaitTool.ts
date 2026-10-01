import type { ChildProcess } from 'node:child_process';

/**
 * Waits for a tool that was started to finish, and reads how it went.
 *
 * @param child - The running tool, its errors piped.
 * @param command - The program it runs, to name where it said nothing.
 * @returns Whether it ran, or that it is not installed.
 * @throws If it ran and failed, with what it said.
 */
const awaitTool = (child: ChildProcess, command: string): Promise<'ran' | 'missing'> => {
  const said: Buffer[] = [];

  child.stderr?.on('data', (chunk: Buffer) => {
    said.push(chunk);
  });

  return new Promise((resolve, reject) => {
    child.on('error', (problem) => {
      if ('code' in problem && problem.code === 'ENOENT') {
        resolve('missing');

        return;
      }

      reject(problem);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve('ran');

        return;
      }

      const message = Buffer.concat(said).toString('utf8').trim();

      reject(new Error(message === '' ? `${command} stopped with ${String(code)}` : message));
    });
  });
};

export { awaitTool };
