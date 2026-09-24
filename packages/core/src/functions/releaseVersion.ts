import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const ManifestSchema = z.object({ '.': z.string() });

const MANIFEST = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '.release-please-manifest.json',
);

/**
 * The version of Valence being built, as release-please last set it, for an app's configuration
 * to stamp on what it builds. Only a build's configuration calls it; nothing that runs in an app
 * does.
 *
 * @returns The version, or `unknown` where the manifest cannot be read.
 */
const releaseVersion = (): string => {
  try {
    return ManifestSchema.parse(JSON.parse(readFileSync(MANIFEST, 'utf8')))['.'];
  } catch {
    return 'unknown';
  }
};

export { releaseVersion };
