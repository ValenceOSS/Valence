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

const askedFor = process.argv.flatMap((arg) =>
  arg.startsWith('--arch=') ? [arg.slice('--arch='.length)] : [],
);

const archs = askedFor.length > 0 ? askedFor : [process.arch];

const hasCargo = spawnSync('cargo', ['--version'], { stdio: 'ignore' }).error === undefined;

for (const arch of archs) {
  const plan = planNativeBuild(process.platform, arch);

  if (plan.kind === 'none') {
    say(`Nothing native to build on this machine for ${arch}.`);
  } else if (!hasCargo && isOptional) {
    say(
      'cargo was not found, so the desktop app starts without its native module and cannot use passkeys.',
    );
  } else {
    run('cargo', plan.args);
    mkdirSync(OUT, { recursive: true });

    const out = join(OUT, plan.module);

    copyFileSync(join(ROOT, plan.library), out);
    say(`Built ${out}.`);
  }
}
