import { ENGLISH } from './ENGLISH';
import { keysNamedIn } from './keysNamedIn';

type BundleFile = { type: 'chunk'; code: string } | { type: 'asset' };

const PLACEHOLDER = '__VALENCE_STRINGS_USED__';

const LEFT_IN = new RegExp(`(["'\`])${PLACEHOLDER}\\1`, 'u');

/**
 * Makes a Vite build carry only the English strings its code names, rather than every string in
 * the product, for a site such as the docs or the landing that draws a handful of them.
 *
 * @returns The Vite plugin.
 */
const onlyUsedStrings = () => {
  const keys = Object.keys(ENGLISH);
  const used = new Set<string>();

  return {
    name: 'valence-only-used-strings',
    apply: 'build' as const,
    enforce: 'pre' as const,
    transform: (code: string, id: string): { code: string; map: null } | null => {
      if (id.split('?')[0]?.endsWith('/packages/i18n/src/ENGLISH.ts') === true) {
        return {
          code: `const ENGLISH = JSON.parse('${PLACEHOLDER}');\n\nexport { ENGLISH };\n`,
          map: null,
        };
      }

      if (!id.includes('/node_modules/')) {
        for (const key of keysNamedIn(code, keys)) {
          used.add(key);
        }
      }

      return null;
    },
    generateBundle: (_options: object, bundle: Record<string, BundleFile>): void => {
      const kept = JSON.stringify(
        JSON.stringify(
          Object.fromEntries(Object.entries(ENGLISH).filter(([key]) => used.has(key))),
        ),
      );

      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && LEFT_IN.test(file.code)) {
          file.code = file.code.replace(LEFT_IN, () => kept);
        }
      }
    },
  };
};

export { onlyUsedStrings };
