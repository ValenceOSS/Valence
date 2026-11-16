import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { anUpdateManifest } from '@ValenceDesktop/build/anUpdateManifest';
import { DEV_CHANNEL_TAG } from '@ValenceDesktop/build/DEV_CHANNEL_TAG';
import { releaseDownloads } from '@ValenceDesktop/build/releaseDownloads';
import { signedBundlesIn } from '@ValenceDesktop/build/signedBundlesIn';

const { values } = parseArgs({
  options: {
    folder: { type: 'string', default: 'release' },
    version: { type: 'string' },
    tag: { type: 'string' },
    dev: { type: 'boolean', default: false },
    repository: {
      type: 'string',
      default: process.env['GITHUB_REPOSITORY'] ?? 'ValenceOSS/Valence',
    },
    out: { type: 'string' },
  },
});

const tag = values.dev ? DEV_CHANNEL_TAG : values.tag;
const version = values.version?.replace(/^v/u, '');
const { signed, unsigned } = signedBundlesIn(readdirSync(values.folder));

if (tag === undefined || tag === '' || version === undefined || version === '') {
  process.stderr.write(
    'Usage: writeUpdateManifest --version <version> (--tag <tag> | --dev) [--folder <folder>] [--repository <owner/name>] [--out <file>]\n',
  );
  process.exitCode = 1;
} else if (unsigned.length > 0 || signed.length === 0) {
  process.stderr.write(
    unsigned.length > 0
      ? `These bundles have no signature beside them, so no updater would take them: ${unsigned.join(', ')}\n`
      : `There is no signed bundle in ${values.folder} for an updater to take.\n`,
  );
  process.exitCode = 1;
} else {
  const out = values.out ?? join(values.folder, 'latest.json');
  const manifest = anUpdateManifest(
    {
      version,
      notes: `https://github.com/${values.repository}/releases/tag/${encodeURIComponent(tag)}`,
      publishedAt: new Date(),
      downloads: releaseDownloads(values.repository, tag),
    },
    signed.map(({ platform, file, signatureFile }) => ({
      platform,
      file,
      signature: readFileSync(join(values.folder, signatureFile), 'utf8'),
    })),
  );

  writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Wrote ${out} for ${Object.keys(manifest.platforms).join(', ')}\n`);
}
