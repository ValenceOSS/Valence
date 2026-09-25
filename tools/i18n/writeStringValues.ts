import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { valuesOf } from './valuesOf';

const SOURCE = join(import.meta.dirname, '..', '..', 'packages', 'i18n', 'src');

const StringsSchema = z.record(z.string(), z.object({ value: z.string() }));

/**
 * Writes values-en.json beside strings-en.json: the same keys with only their words, which is what
 * the apps import.
 */
const writeStringValues = (): void => {
  const strings = StringsSchema.parse(
    JSON.parse(readFileSync(join(SOURCE, 'strings-en.json'), 'utf8')),
  );

  writeFileSync(join(SOURCE, 'values-en.json'), `${JSON.stringify(valuesOf(strings), null, 2)}\n`);
};

writeStringValues();
