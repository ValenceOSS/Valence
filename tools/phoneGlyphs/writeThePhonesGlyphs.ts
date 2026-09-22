import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { theGlyphsAsWritten } from './theGlyphsAsWritten';

const WHERE = resolve(
  import.meta.dirname,
  '..',
  '..',
  'apps',
  'ios',
  'src',
  'theme',
  'theGlyphs.ts',
);

writeFileSync(WHERE, theGlyphsAsWritten());

process.stdout.write(`Wrote ${WHERE}\n`);
