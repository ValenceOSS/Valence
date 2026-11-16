import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { whereTheDecodersAre } from '@ValenceDesktop/build/whereTheDecodersAre';

const app = resolve(import.meta.dirname, '..', '..');
const repository = resolve(app, '..', '..');
const { built, shipped } = whereTheDecodersAre(repository, app, process.env['CARGO_TARGET_DIR']);
const cargo = spawnSync(
  'cargo',
  ['build', '--release', '-p', 'valence-browser-decoders', '--target', 'wasm32-unknown-unknown'],
  { cwd: repository, stdio: 'inherit' },
);

if (cargo.status === 0) {
  mkdirSync(dirname(shipped), { recursive: true });
  copyFileSync(built, shipped);
  process.stdout.write(`Shipping the browser decoders from ${built}\n`);
} else {
  process.stderr.write(
    'Cargo could not build the browser decoders, as it says above. They are WebAssembly, so Rust needs that target too: rustup target add wasm32-unknown-unknown\n',
  );
  process.exitCode = cargo.status ?? 1;
}
