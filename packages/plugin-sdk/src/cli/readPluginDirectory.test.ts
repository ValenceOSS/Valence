import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aPluginFolder } from '@ValenceSDK/testing/aPluginFolder';
import { readPluginDirectory } from './readPluginDirectory';

describe('readPluginDirectory', () => {
  it('reads the manifest, the code the entry names, and only the pictures under assets', () => {
    const plugin = readPluginDirectory(aPluginFolder());

    expect(plugin.manifest.id).toBe('anime-tracker');
    expect(plugin.code).toBe('globalThis.valencePlugin = {};');
    expect(Object.keys(plugin.assets)).toEqual(['icon.png']);
  });

  it('reads no code for a plugin with no entry', () => {
    const plugin = readPluginDirectory(
      aPluginFolder({ entry: undefined, permissions: [], contributes: {}, icon: undefined }),
    );

    expect(plugin.code).toBeUndefined();
  });

  it('reads no assets when there is no assets folder', () => {
    const folder = aPluginFolder({ icon: undefined });

    rmSync(join(folder, 'assets'), { recursive: true });

    expect(readPluginDirectory(folder).assets).toEqual({});
  });
});
