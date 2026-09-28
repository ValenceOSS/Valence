import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readPluginPackage } from '@ValenceSDK/package/readPluginPackage';
import { aPluginFolder } from '@ValenceSDK/testing/aPluginFolder';
import { packCommand } from './packCommand';

describe('packCommand', () => {
  it('writes a package that opens as the same plugin', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'valence-out-')), 'nested');
    const path = packCommand(aPluginFolder(), out);

    expect(path).toBe(join(out, 'anime-tracker-1.2.0.vplugin'));
    expect(readPluginPackage(readFileSync(path)).ok).toBe(true);
  });
});
