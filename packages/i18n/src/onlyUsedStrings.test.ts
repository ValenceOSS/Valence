import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { onlyUsedStrings } from './onlyUsedStrings';

const ENGLISH_ID = '/repo/packages/i18n/src/ENGLISH.ts';

/**
 * Reads the strings a filled chunk carries.
 *
 * @param code - The chunk.
 * @returns The strings, by key.
 */
const keptIn = (code: string): Record<string, string> =>
  z
    .record(z.string(), z.string())
    .parse(
      JSON.parse(
        z.string().parse(JSON.parse(/JSON\.parse\((".*?[^\\]")\)/u.exec(code)?.[1] ?? '""')),
      ),
    );

describe('onlyUsedStrings', () => {
  it('fills the placeholder, in any quotes and every copy, with only the strings the build named', () => {
    const plugin = onlyUsedStrings();

    expect(plugin.transform('const ENGLISH = {};', ENGLISH_ID)?.code).toContain(
      "JSON.parse('__VALENCE_STRINGS_USED__')",
    );
    expect(plugin.transform("say('common.save')", '/repo/apps/docs/src/Page.tsx')).toBeNull();
    expect(plugin.transform("say('common.cancel')", '/repo/node_modules/x/index.js')).toBeNull();

    const once = plugin.renderChunk('const E=JSON.parse("__VALENCE_STRINGS_USED__");')?.code ?? '';
    const twice =
      plugin.renderChunk(
        "a=JSON.parse('__VALENCE_STRINGS_USED__');b=JSON.parse(`__VALENCE_STRINGS_USED__`)",
      )?.code ?? '';

    expect(Object.keys(keptIn(once))).toEqual(['common.save']);
    expect(twice).not.toContain('__VALENCE_STRINGS_USED__');
    expect(plugin.renderChunk('const nothing = 1;')).toBeNull();
    expect(() => {
      plugin.generateBundle();
    }).not.toThrow();
  });

  it('fails the build where it trimmed the strings but found nowhere to put them', () => {
    const plugin = onlyUsedStrings();

    plugin.transform('const ENGLISH = {};', ENGLISH_ID);
    plugin.renderChunk('const E = JSON.parse("something else");');

    expect(() => {
      plugin.generateBundle();
    }).toThrow('no placeholder to fill');
  });

  it('answers a key it did not keep with the key itself, rather than nothing', async () => {
    const plugin = onlyUsedStrings();
    const code = plugin.transform('', ENGLISH_ID)?.code ?? '';

    plugin.transform("say('common.save')", '/repo/apps/docs/src/Page.tsx');

    const filled = plugin.renderChunk(code)?.code ?? '';
    const loaded = z
      .object({
        ENGLISH: z.custom<Readonly<Record<string, string>>>(
          (value) => typeof value === 'object' && value !== null,
        ),
      })
      .parse(await import(`data:text/javascript,${encodeURIComponent(filled)}`));

    expect(loaded.ENGLISH['common.save']).not.toBe('common.save');
    expect(loaded.ENGLISH['ui.never.named']).toBe('ui.never.named');
    expect(Object.hasOwn(loaded.ENGLISH, 'ui.never.named')).toBe(false);
  });

  it('runs only for a build', () => {
    expect(onlyUsedStrings().apply).toBe('build');
  });
});
