import ts from 'typescript';
import { ANIMATION_LIBRARIES } from './ANIMATION_LIBRARIES';
import { upstreamOf } from './upstreamOf';

/**
 * Reads which third-party UI libraries a component is built on, from the imports in its files, so
 * the UI library can point at the documentation of whatever its props pass through to. Each
 * library is named once, in the order it is first imported, except that a library it only animates
 * with comes after the ones it is actually made of.
 *
 * @param sources - The text of each of the component's files.
 * @returns The libraries, with where their props are documented.
 */
const readBuiltOn = (sources: readonly string[]): { name: string; url: string }[] => {
  const found = new Map<string, { name: string; url: string }>();
  const animating = new Map<string, { name: string; url: string }>();

  for (const text of sources) {
    const source = ts.createSourceFile(
      'file.tsx',
      text,
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TSX,
    );

    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue;
      }

      const upstream = upstreamOf(statement.moduleSpecifier.text);

      if (upstream !== null) {
        (ANIMATION_LIBRARIES.has(statement.moduleSpecifier.text) ? animating : found).set(
          upstream.url,
          upstream,
        );
      }
    }
  }

  return [...found.values(), ...animating.values()];
};

export { readBuiltOn };
