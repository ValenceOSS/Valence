import { describe, expect, it } from 'vitest';
import { aManifest } from '@ValenceSDK/testing/aManifest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { packPlugin } from './packPlugin';
import { readPluginPackage } from './readPluginPackage';

describe('packPlugin', () => {
  it('packs a plugin that reads back the same', () => {
    const plugin = {
      format: 1 as const,
      manifest: PluginManifestSchema.parse(aManifest({ icon: 'icon.png' })),
      code: 'globalThis.valencePlugin = {};',
      assets: { 'icon.png': Buffer.from('png').toString('base64') },
    };
    const opened = readPluginPackage(packPlugin(plugin));

    expect(opened).toEqual({ ok: true, plugin });
  });

  it('refuses to pack a plugin that breaks the package rules', () => {
    expect(() =>
      packPlugin({ format: 1, manifest: PluginManifestSchema.parse(aManifest()), assets: {} }),
    ).toThrow();
  });
});
