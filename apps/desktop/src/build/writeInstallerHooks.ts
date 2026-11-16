import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { APP_ID } from '@ValenceDesktop/build/APP_ID';
import { electronBuildersGuid } from '@ValenceDesktop/build/electronBuildersGuid';
import { installerHooks } from '@ValenceDesktop/build/installerHooks';

const { values } = parseArgs({ options: { out: { type: 'string' } } });

if (values.out === undefined || values.out === '') {
  process.stderr.write('Usage: writeInstallerHooks --out <file>\n');
  process.exitCode = 1;
} else {
  writeFileSync(values.out, installerHooks(electronBuildersGuid(APP_ID)));
  process.stdout.write(`Wrote ${values.out}\n`);
}
