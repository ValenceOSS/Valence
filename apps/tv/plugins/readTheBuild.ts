import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { commitBuiltFrom } from '@valence/core/src/functions/commitBuiltFrom.ts';

const ManifestSchema = z.object({ '.': z.string() });

const MANIFEST = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '.release-please-manifest.json',
);

/**
 * Which release of Valence this is and the commit it is built from, read once from the checkout
 * doing the building, since an installed app carries neither the release manifest nor a `.git`.
 *
 * @returns The release, from the repository's release manifest, and a short commit hash, each
 *   `unknown` where the checkout has none to give.
 */
const readTheBuild = (): { version: string; commit: string } => {
  let version = 'unknown';

  try {
    version = ManifestSchema.parse(JSON.parse(readFileSync(MANIFEST, 'utf8')))['.'];
  } catch {}

  return { version, commit: commitBuiltFrom() };
};

export { readTheBuild };
