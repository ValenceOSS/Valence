import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { onlyUsedStrings } from './onlyUsedStrings';

describe('onlyUsedStrings', () => {
  it('leaves a placeholder for the strings, then fills in only the ones the build named', () => {
    const plugin = onlyUsedStrings();
    const english = plugin.transform(
      'const ENGLISH = { ... };',
      '/repo/packages/i18n/src/ENGLISH.ts',
    );

    expect(english?.code).toContain("JSON.parse('__VALENCE_STRINGS_USED__')");
    expect(plugin.transform("say('common.save')", '/repo/apps/docs/src/Page.tsx')).toBeNull();
    expect(plugin.transform("say('common.cancel')", '/repo/node_modules/x/index.js')).toBeNull();

    const chunk = {
      type: 'chunk' as const,
      code: 'const E=JSON.parse("__VALENCE_STRINGS_USED__");',
    };

    plugin.generateBundle({}, { 'index.js': chunk, 'logo.png': { type: 'asset' } });

    const filled = z
      .record(z.string(), z.string())
      .parse(
        JSON.parse(
          z.string().parse(JSON.parse(chunk.code.slice('const E=JSON.parse('.length, -2))),
        ),
      );

    expect(Object.keys(filled)).toEqual(['common.save']);
    expect(typeof filled['common.save']).toBe('string');
  });

  it('runs only for a build', () => {
    expect(onlyUsedStrings().apply).toBe('build');
  });
});
