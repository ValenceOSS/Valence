import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { planNativeBuild } from './planNativeBuild';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const OUT = join(ROOT, 'apps', 'desktop', 'dist-native');

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Runs a command in the repository, failing the build with its own output.
 *
 * @param command - The command to run.
 * @param args - Its arguments.
 * @throws If the command is missing or exits non-zero.
 */
const run = (command: string, args: string[]): void => {
  const outcome = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });

  if (outcome.error !== undefined) {
    throw new Error(
      `${command} is not on this machine, and the desktop app's native module needs it.`,
    );
  }

  if (outcome.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed.`);
  }
};

const isOptional = process.argv.includes('--optional');

const hasCargo = spawnSync('cargo', ['--version'], { stdio: 'ignore' }).error === undefined;

const plan = planNativeBuild(process.platform);

if (plan.kind === 'none') {
  say('Nothing native to build on this machine.');
} else if (!hasCargo && isOptional) {
  say(
    'cargo was not found, so the desktop app starts without its native module and cannot use passkeys.',
  );
} else {
  run('cargo', plan.args);
  mkdirSync(OUT, { recursive: true });

  const out = join(OUT, 'valence.node');

  copyFileSync(join(ROOT, plan.library), out);
  say(`Built ${out}.`);
}
