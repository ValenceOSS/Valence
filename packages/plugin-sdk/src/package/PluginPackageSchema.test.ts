import { describe, expect, it } from 'vitest';
import { aManifest } from '@ValenceSDK/testing/aManifest';
import { PluginPackageSchema } from './PluginPackageSchema';

describe('PluginPackageSchema', () => {
  it('accepts a package whose code matches its entry', () => {
    const plugin = PluginPackageSchema.parse({ format: 1, manifest: aManifest(), code: 'void 0;' });

    expect(plugin.assets).toEqual({});
  });

  it('refuses code without an entry, and an entry without code', () => {
    const messages = (input: Parameters<typeof PluginPackageSchema.safeParse>[0]) => {
      const read = PluginPackageSchema.safeParse(input);

      return read.success ? [] : read.error.issues.map((issue) => issue.message);
    };

    expect(messages({ format: 1, manifest: aManifest() })).toContain(
      'A package carries code exactly when its manifest names an entry',
    );
    expect(
      messages({
        format: 1,
        manifest: { ...aManifest(), entry: undefined, permissions: [], contributes: {} },
        code: 'void 0;',
      }),
    ).toContain('A package carries code exactly when its manifest names an entry');
  });

  it('refuses an icon that is not packed', () => {
    const read = PluginPackageSchema.safeParse({
      format: 1,
      manifest: aManifest({ icon: 'icon.png' }),
      code: 'void 0;',
    });

    expect(read.success ? [] : read.error.issues.map((issue) => issue.message)).toContain('The icon icon.png is not packed');
  });

  it('refuses an asset name that could escape, and asset data that is not base64', () => {
    expect(
      PluginPackageSchema.safeParse({ format: 1, manifest: aManifest(), code: '', assets: { '../x.png': 'AAAA' } })
        .success,
    ).toBe(false);
    expect(
      PluginPackageSchema.safeParse({ format: 1, manifest: aManifest(), code: '', assets: { 'x.png': '<svg>' } })
        .success,
    ).toBe(false);
  });

  it('refuses too many assets', () => {
    const assets = Object.fromEntries(Array.from({ length: 33 }, (_, at) => [`a${at.toString()}.png`, 'AAAA']));

    expect(PluginPackageSchema.safeParse({ format: 1, manifest: aManifest(), code: '', assets }).success).toBe(false);
  });
});
