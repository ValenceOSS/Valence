import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

const DIALECT_METHODS = new Set([
  'returning',
  'onConflictDoNothing',
  'onConflictDoUpdate',
  'selectDistinctOn',
]);

const DIALECT_SQL = [
  {
    pattern: /::/u,
    found: '::',
    instead: 'a helper from #dialect/*, such as jsonLiteral or jsonAsText',
  },
  { pattern: /\|\|/u, found: '||', instead: 'concatenated from #dialect/concatenated' },
  { pattern: /\bnulls\s+(?:first|last)\b/iu, found: 'nulls last', instead: 'nullsLast' },
  { pattern: /\bfilter\s*\(\s*where\b/iu, found: 'filter (where', instead: 'countWhere' },
  {
    pattern: /"[^"]*"/u,
    found: 'a double-quoted identifier',
    instead: 'sql.identifier or the column itself',
  },
] as const;

const createRule = ESLintUtils.RuleCreator(() => 'https://valence.local/neutral-queries');

type MessageId = 'method' | 'ilike' | 'raw';

/**
 * Whether a tag or callee is drizzle's `sql`, or `sql.raw`.
 *
 * @param node - The tag of a template, or the callee of a call.
 * @returns Whether it builds raw SQL.
 */
const isSql = (node: TSESTree.Node): boolean =>
  (node.type === AST_NODE_TYPES.Identifier && node.name === 'sql') ||
  (node.type === AST_NODE_TYPES.MemberExpression &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === 'sql' &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    node.property.name === 'raw');

const neutralQueries = createRule({
  name: 'neutral-queries',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Shared query code runs on every database Valence supports, so it writes nothing only one of them reads.',
    },
    messages: {
      method:
        'Only Postgres has .{{ found }}(). Use {{ instead }} — see "One query, several databases" in the coding standard.',
      ilike:
        'Only Postgres has ilike. Use containsInsensitively — see "One query, several databases" in the coding standard.',
      raw: 'Only some databases read {{ found }} in raw SQL. Use {{ instead }} — see "One query, several databases" in the coding standard.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: Readonly<TSESLint.RuleContext<MessageId, []>>) => {
    const lookAt = (node: TSESTree.Node, text: string): void => {
      const construct = DIALECT_SQL.find(({ pattern }) => pattern.test(text));

      if (construct !== undefined) {
        context.report({
          node,
          messageId: 'raw',
          data: { found: construct.found, instead: construct.instead },
        });
      }
    };

    return {
      CallExpression: (node) => {
        const { callee } = node;

        if (isSql(callee)) {
          const [text] = node.arguments;

          if (text?.type === AST_NODE_TYPES.Literal && typeof text.value === 'string') {
            lookAt(node, text.value);
          }

          return;
        }

        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.property.type === AST_NODE_TYPES.Identifier &&
          DIALECT_METHODS.has(callee.property.name)
        ) {
          const found = callee.property.name;
          const instead =
            found === 'returning'
              ? 'countAffected, or a transaction that reads the row back'
              : found === 'onConflictDoUpdate'
                ? 'upsert'
                : found === 'onConflictDoNothing'
                  ? 'insertUnlessPresent'
                  : 'a grouped query';

          context.report({ node: callee.property, messageId: 'method', data: { found, instead } });
        }
      },
      ImportDeclaration: (node) => {
        if (node.source.value !== 'drizzle-orm') {
          return;
        }

        node.specifiers
          .filter(
            (specifier) =>
              specifier.type === AST_NODE_TYPES.ImportSpecifier &&
              specifier.imported.type === AST_NODE_TYPES.Identifier &&
              specifier.imported.name === 'ilike',
          )
          .forEach((specifier) => {
            context.report({ node: specifier, messageId: 'ilike' });
          });
      },
      TaggedTemplateExpression: (node) => {
        if (isSql(node.tag)) {
          lookAt(node, node.quasi.quasis.map((quasi) => quasi.value.raw).join(' '));
        }
      },
    };
  },
});

export { neutralQueries };
