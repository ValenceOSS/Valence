import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findLooseDependencies } from './findLooseDependencies';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const MANIFESTS = [
  join(ROOT, 'package.json'),
  ...['apps', 'packages'].flatMap((folder) =>
    readdirSync(join(ROOT, folder))
      .map((name) => join(ROOT, folder, name, 'package.json'))
      .filter((manifest) => existsSync(manifest)),
  ),
];

describe('findLooseDependencies', () => {
  it('lists every dependency that names a range', () => {
    const packageJson = JSON.stringify({
      dependencies: { zod: '^4.6.4', react: '19.3.0' },
      devDependencies: { vitest: '~4.1.11', '@valence/core': 'workspace:*' },
      optionalDependencies: { sharp: '*' },
    });

    expect(findLooseDependencies(packageJson)).toEqual(['zod@^4.6.4', 'vitest@~4.1.11', 'sharp@*']);
  });

  it('leaves peer dependencies their ranges', () => {
    const packageJson = JSON.stringify({ peerDependencies: { react: '^19.0.0' } });

    expect(findLooseDependencies(packageJson)).toEqual([]);
  });

  it.each(MANIFESTS.map((manifest) => [manifest.slice(ROOT.length + 1)]))(
    'finds every dependency in %s pinned to one version',
    (manifest) => {
      expect(findLooseDependencies(readFileSync(join(ROOT, manifest), 'utf8'))).toEqual([]);
    },
  );
});
