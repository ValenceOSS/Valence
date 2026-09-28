import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { aManifest } from '@ValenceSDK/testing/aManifest';
import { PACKAGE_LIMITS } from './PACKAGE_LIMITS';
import { readPluginPackage } from './readPluginPackage';

describe('readPluginPackage', () => {
  it('refuses a file larger than a plugin may be', () => {
    expect(readPluginPackage(new Uint8Array(PACKAGE_LIMITS.packageBytes + 1))).toEqual({
      ok: false,
      problem: 'The package is larger than 8 MB.',
    });
  });

  it('refuses a file that is not gzipped', () => {
    expect(readPluginPackage(new TextEncoder().encode('{}'))).toEqual({
      ok: false,
      problem: 'The package is not a gzipped Valence plugin.',
    });
  });

  it('refuses a small file that unpacks into something far too large', () => {
    const bomb = gzipSync(Buffer.alloc(PACKAGE_LIMITS.packageBytes * 3, 32));

    expect(bomb.byteLength).toBeLessThan(PACKAGE_LIMITS.packageBytes);
    expect(readPluginPackage(bomb)).toEqual({ ok: false, problem: 'The package is not a gzipped Valence plugin.' });
  });

  it('refuses gzipped text that is not JSON', () => {
    expect(readPluginPackage(gzipSync('not json'))).toEqual({ ok: false, problem: 'The package does not hold JSON.' });
  });

  it('says why a package breaks the rules', () => {
    const opened = readPluginPackage(gzipSync(JSON.stringify({ format: 1, manifest: aManifest() })));

    expect(opened.ok).toBe(false);
    expect(opened.ok ? '' : opened.problem).toContain('A package carries code exactly when its manifest names an entry');
  });
});
