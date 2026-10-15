import { execFile, spawn } from 'node:child_process';
import { access, mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { MountMachinery } from './MountMachinery';

const MOST_SAID = 8000;

/**
 * Lets go of whatever is mounted on a folder, including a mount whose rclone has gone, which
 * otherwise leaves the folder unreadable until the machine restarts.
 *
 * @param target - The folder.
 */
const unmount = (target: string): Promise<void> =>
  new Promise((resolve) => {
    execFile('fusermount3', ['-uz', target], () => {
      resolve();
    });
  });

/**
 * The real processes and files buckets are mounted with: rclone, FUSE and the disk.
 *
 * @param rclone - The rclone to run.
 * @returns The machinery.
 */
const createRcloneMachinery = (rclone: string): MountMachinery => ({
  hasFuse: () =>
    access('/dev/fuse').then(
      () => true,
      () => false,
    ),

  run: (args, env, withinMs) =>
    new Promise((resolve) => {
      execFile(
        rclone,
        args,
        { env: { ...process.env, ...env }, timeout: withinMs },
        (error, out, said) => {
          resolve({ ok: error === null, out, said: said || (error?.message ?? '') });
        },
      );
    }),

  start: (args, env) => {
    const child = spawn(rclone, args, {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let said = '';

    child.stderr.on('data', (chunk: Buffer) => {
      said = (said + chunk.toString()).slice(-MOST_SAID);
    });

    return {
      onExit: (listener) => {
        child.on('error', (failure) => {
          listener(failure.message);
        });
        child.on('exit', () => {
          listener(said);
        });
      },
      stop: () => {
        child.kill('SIGTERM');
      },
    };
  },

  prepare: async (target, cacheDirectory) => {
    await unmount(target);
    await mkdir(target, { recursive: true });
    await mkdir(cacheDirectory, { recursive: true });
  },

  release: unmount,

  isMounted: async (target) => {
    const [mounted, parent] = await Promise.all([stat(target), stat(dirname(target))]);

    return mounted.dev !== parent.dev;
  },
});

export { createRcloneMachinery };
