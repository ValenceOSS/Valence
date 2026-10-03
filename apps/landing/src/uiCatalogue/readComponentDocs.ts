import ts from 'typescript6';
import type { UiComponentDoc, UiPropDoc } from './uiCatalogue.types';

type Member = { name: string; type: ts.TypeNode | undefined; isOptional: boolean };

type Resolved = { members: Member[]; inherits: string[] };

const WHITESPACE = /\s+/gu;

const LEADING_DASH = /^-\s*/u;

/**
 * Reads the comment text of a JSDoc node or tag, whether it was written as one string or as parts
 * with inline links, as plain text on one line.
 *
 * @param comment - The comment as TypeScript parsed it.
 * @returns The text, trimmed, or an empty string for none.
 */
const commentText = (comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string => {
  if (comment === undefined) {
    return '';
  }

  const text = typeof comment === 'string' ? comment : comment.map((part) => part.text).join('');

  return text.replace(WHITESPACE, ' ').trim();
};

/**
 * Finds the declaration a component is written as — `const Name = (...) => ...` or
 * `function Name(...)` — so its TSDoc and its parameter defaults can be read.
 *
 * @param source - The component's file.
 * @param name - The component's name.
 * @returns The statement and the function it declares, or null where there is neither.
 */
const findComponent = (
  source: ts.SourceFile,
  name: string,
): { statement: ts.Node; fn: ts.SignatureDeclaration } | null => {
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      return { statement, fn: statement };
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;

      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        init !== undefined &&
        (ts.isArrowFunction(init) || ts.isFunctionExpression(init))
      ) {
        return { statement, fn: init };
      }
    }
  }

  return null;
};

/**
 * Reads what a component's TSDoc says: the first paragraph as its summary, and each `@param` as the
 * description of the prop it names.
 *
 * @param statement - The statement the TSDoc sits on.
 * @returns The summary and the described props.
 */
const readTsDoc = (statement: ts.Node): { summary: string; params: Map<string, string> } => {
  const params = new Map<string, string>();
  let summary = '';

  for (const doc of ts.getJSDocCommentsAndTags(statement)) {
    if (!ts.isJSDoc(doc)) {
      continue;
    }

    const raw = typeof doc.comment === 'string' ? doc.comment : commentText(doc.comment);

    summary = (raw.split(/\n\s*\n/u)[0] ?? '').replace(WHITESPACE, ' ').trim();

    for (const tag of doc.tags ?? []) {
      if (ts.isJSDocParameterTag(tag) && ts.isIdentifier(tag.name)) {
        params.set(tag.name.text, commentText(tag.comment).replace(LEADING_DASH, ''));
      }
    }
  }

  return { summary, params };
};

/**
 * Reads the defaults a component gives its props in the destructuring of its first parameter.
 *
 * @param fn - The component's function.
 * @param source - The file it is in, to print the defaults from.
 * @returns Each prop's default, as written.
 */
const readDefaults = (fn: ts.SignatureDeclaration, source: ts.SourceFile): Map<string, string> => {
  const defaults = new Map<string, string>();
  const first = fn.parameters[0];

  if (first === undefined || !ts.isObjectBindingPattern(first.name)) {
    return defaults;
  }

  for (const element of first.name.elements) {
    const key = element.propertyName ?? element.name;

    if (ts.isIdentifier(key) && element.initializer !== undefined) {
      defaults.set(key.text, element.initializer.getText(source));
    }
  }

  return defaults;
};

/**
 * Finds a type alias declared in a file by name.
 *
 * @param source - The file.
 * @param name - The alias's name.
 * @returns The alias, or null where the file declares none by that name.
 */
const findAlias = (source: ts.SourceFile, name: string): ts.TypeAliasDeclaration | null => {
  for (const statement of source.statements) {
    if (ts.isTypeAliasDeclaration(statement) && statement.name.text === name) {
      return statement;
    }
  }

  return null;
};

/**
 * Lists the props a type spells out — through intersections, parentheses, unions of object types
 * and other aliases in the same file — and names whatever it inherits from elsewhere.
 *
 * @param node - The type.
 * @param source - The file it is in, to follow its aliases and print what it inherits.
 * @param seen - The aliases already followed, so a loop cannot run forever.
 * @returns The members found and the types inherited.
 */
const resolveMembers = (node: ts.TypeNode, source: ts.SourceFile, seen: Set<string>): Resolved => {
  if (ts.isParenthesizedTypeNode(node)) {
    return resolveMembers(node.type, source, seen);
  }

  if (ts.isTypeLiteralNode(node)) {
    return {
      members: node.members.flatMap((member) =>
        ts.isPropertySignature(member) &&
        (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))
          ? [
              {
                name: member.name.text,
                type: member.type,
                isOptional: member.questionToken !== undefined,
              },
            ]
          : [],
      ),
      inherits: [],
    };
  }

  if (ts.isIntersectionTypeNode(node)) {
    const parts = node.types.map((part) => resolveMembers(part, source, seen));

    return {
      members: parts.flatMap((part) => part.members),
      inherits: parts.flatMap((part) => part.inherits),
    };
  }

  if (ts.isUnionTypeNode(node)) {
    const parts = node.types.map((part) => resolveMembers(part, source, seen));
    const byName = new Map<string, Member>();

    for (const part of parts) {
      for (const member of part.members) {
        if (!byName.has(member.name)) {
          const inEvery = parts.every((other) =>
            other.members.some((one) => one.name === member.name),
          );

          byName.set(member.name, { ...member, isOptional: member.isOptional || !inEvery });
        }
      }
    }

    return { members: [...byName.values()], inherits: parts.flatMap((part) => part.inherits) };
  }

  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const alias = seen.has(node.typeName.text) ? null : findAlias(source, node.typeName.text);

    if (alias !== null) {
      return resolveMembers(alias.type, source, new Set([...seen, node.typeName.text]));
    }
  }

  return { members: [], inherits: [node.getText(source)] };
};

/**
 * Lists the string values a prop can take, where its type is a union of string literals written
 * directly or through an alias in the same file.
 *
 * @param node - The prop's type.
 * @param source - The file it is in, to follow its aliases.
 * @returns The values, in the order written, or none.
 */
const literalValues = (node: ts.TypeNode | undefined, source: ts.SourceFile): string[] => {
  if (node === undefined) {
    return [];
  }

  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const alias = findAlias(source, node.typeName.text);

    return alias === null ? [] : literalValues(alias.type, source);
  }

  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
    return [node.literal.text];
  }

  if (ts.isUnionTypeNode(node)) {
    const values = node.types.map((part) => literalValues(part, source));

    return values.every((one) => one.length > 0) ? values.flat() : [];
  }

  return [];
};

/**
 * Reads what a ValenceUI component documents about itself — its summary, and for each prop its
 * type, the values it takes, whether it is required, its default and its description — straight
 * from its source, so a page listing the components never drifts from them.
 *
 * @param name - The component's name.
 * @param componentText - The text of the component's own file.
 * @param typesText - The text of its types file, or null where its props are declared beside it.
 * @returns What it documents.
 */
const readComponentDocs = (
  name: string,
  componentText: string,
  typesText: string | null,
): UiComponentDoc => {
  const component = ts.createSourceFile(
    `${name}.tsx`,
    componentText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const types =
    typesText === null
      ? component
      : ts.createSourceFile(
          `${name}.types.ts`,
          typesText,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );
  const found = findComponent(component, name);
  const { summary, params } =
    found === null
      ? { summary: '', params: new Map<string, string>() }
      : readTsDoc(found.statement);
  const defaults = found === null ? new Map<string, string>() : readDefaults(found.fn, component);
  const alias = findAlias(types, `${name}Props`) ?? findAlias(component, `${name}Props`);
  const source = alias === null ? types : alias.getSourceFile();
  const { members, inherits } =
    alias === null
      ? { members: [], inherits: [] }
      : resolveMembers(alias.type, source, new Set([alias.name.text]));

  const props = members.map((member): UiPropDoc => ({
    name: member.name,
    type:
      member.type === undefined ? 'unknown' : member.type.getText(source).replace(WHITESPACE, ' '),
    values: literalValues(member.type, source),
    isRequired: !member.isOptional && !defaults.has(member.name),
    defaultValue: defaults.get(member.name) ?? null,
    description: params.get(member.name) ?? null,
  }));

  return { name, summary, props, inherits, builtOn: [] };
};

export { readComponentDocs };
