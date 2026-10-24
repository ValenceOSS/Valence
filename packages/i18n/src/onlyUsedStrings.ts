import { ENGLISH } from './ENGLISH';
import { keysNamedIn } from './keysNamedIn';

const PLACEHOLDER = '__VALENCE_STRINGS_USED__';

const LEFT_IN = new RegExp(`(["'\`])${PLACEHOLDER}\\1`, 'gu');

const TRIMMED_MODULE = [
  `const KEPT = JSON.parse('${PLACEHOLDER}');`,
  '',
  'const ENGLISH = new Proxy(KEPT, {',
  "  get: (kept, key) => (typeof key === 'string' && !Object.hasOwn(kept, key) ? key : Reflect.get(kept, key)),",
  '});',
  '',
  'export { ENGLISH };',
  '',
].join('\n');

/**
 * Makes a Vite build carry only the English strings its code names, rather than every string in
 * the product, for a site such as the docs or the landing that draws a handful of them.
 *
 * @returns The Vite plugin.
 */
const onlyUsedStrings = () => {
  const keys = Object.keys(ENGLISH);
  const used = new Set<string>();
  let isTrimming = false;
  let filled = 0;

  return {
    name: 'valence-only-used-strings',
    apply: 'build' as const,
    enforce: 'pre' as const,
    transform: (code: string, id: string): { code: string; map: null } | null => {
      if (id.split('?')[0]?.endsWith('/packages/i18n/src/ENGLISH.ts') === true) {
        isTrimming = true;

        return { code: TRIMMED_MODULE, map: null };
      }

      if (!id.includes('/node_modules/')) {
        for (const key of keysNamedIn(code, keys)) {
          used.add(key);
        }
      }

      return null;
    },
    renderChunk: (code: string): { code: string; map: null } | null => {
      if (!LEFT_IN.test(code)) {
        return null;
      }

      const kept = JSON.stringify(
        JSON.stringify(
          Object.fromEntries(Object.entries(ENGLISH).filter(([key]) => used.has(key))),
        ),
      );

      filled += 1;
      LEFT_IN.lastIndex = 0;

      return { code: code.replace(LEFT_IN, () => kept), map: null };
    },
    generateBundle: (): void => {
      if (isTrimming && filled === 0) {
        throw new Error(
          'The English strings were trimmed, but the bundle holds no placeholder to fill.',
        );
      }
    },
  };
};

export { onlyUsedStrings };
