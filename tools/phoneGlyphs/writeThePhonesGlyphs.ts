import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { theGlyphsAsWritten } from './theGlyphsAsWritten';

const WHERE = resolve(import.meta.dirname, '..', '..', 'apps', 'ios', 'src', 'glyphs');

rmSync(WHERE, { recursive: true, force: true });
mkdirSync(WHERE, { recursive: true });

for (const [name, contents] of theGlyphsAsWritten()) {
  writeFileSync(join(WHERE, name), contents);
}

process.stdout.write(`Wrote ${theGlyphsAsWritten().size.toString()} glyphs into ${WHERE}\n`);
