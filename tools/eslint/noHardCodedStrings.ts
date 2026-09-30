import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

const WORDED_PROPS = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'body',
  'caption',
  'cancelLabel',
  'confirmLabel',
  'description',
  'detail',
  'empty',
  'emptyText',
  'error',
  'eyebrow',
  'heading',
  'helper',
  'hint',
  'label',
  'lede',
  'message',
  'placeholder',
  'subtitle',
  'summary',
  'text',
  'title',
  'tooltip',
]);

const QUIET_CALLS = new Set([
  'cn',
  'cva',
  'clsx',
  'twMerge',
  'require',
  'describe',
  'it',
  'test',
  'log',
  'print',
  'say',
  'saying',
  'sayCount',
  'sayingCount',
  'sayParts',
  'sayVerbatim',
  'refuse',
]);

const QUIET_METHODS = new Set(['debug', 'info', 'warn', 'error', 'trace', 'fatal', 'log', 'write']);

const QUIET_OBJECTS = /^(?:console|log|logger|logs|this|stdout|stderr)$/u;

const READING_METHODS = new Set([
  'addEventListener',
  'closest',
  'dispatchEvent',
  'endsWith',
  'get',
  'getAll',
  'getItem',
  'header',
  'has',
  'includes',
  'indexOf',
  'lastIndexOf',
  'match',
  'matches',
  'openapi',
  'querySelector',
  'querySelectorAll',
  'removeEventListener',
  'removeItem',
  'replace',
  'replaceAll',
  'setItem',
  'split',
  'startsWith',
]);

const QUIET_KEYS = new Set([
  'accept',
  'authorization',
  'Authorization',
  'code',
  'content-type',
  'Content-Type',
  'displayName',
  'fontFamily',
  'fontWeight',
  'id',
  'kind',
  'onDelete',
  'onUpdate',
  'rel',
  'sameSite',
  'tags',
  'textAlign',
  'transform',
  'transformOrigin',
  'user-agent',
  'User-Agent',
  'userAgent',
  'Vary',
]);

const QUIET_ATTRIBUTES =
  /^(?:allow|className|class|style|id|key|href|src|to|rel|target|type|role|name|data-.+|testID|nativeID)$/u;

const HEADER_NAME = /^[A-Z][a-z]*(?:-[A-Z][a-z]*)+$/u;

const LETTER = /\p{L}/u;

const STRING_KEY = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*\.[a-zA-Z0-9]*$/u;

const CAPITALISED = /^\s*[\p{Lu}][\p{Ll}’']/u;

const SENTENCE = /\p{L}[.!?…]\s*$/u;

const CLASSES = /(?:^|\s)[\w[\]!/.%-]*[-:[][\w[\]!/.%:()'#,-]*(?:\s|$)/u;

const PLAIN_WORD = /^[\p{L}’']+[,.!?…:;]?$/u;

const MEASURE = /^[\d.,]+\s?(?:p|K|k|i|MB|GB|TB|kbps|Mbps|fps|Hz|kHz|x|ms|s)$/u;

const STYLE_VALUE =
  /^[a-z][\w-]*\(|(?:^|,\s*)(?:serif|sans-serif|monospace|cursive|system-ui|ui-serif|ui-monospace)$/u;

const DISPOSITION = /^(?:attachment|inline);/u;

const DIRECTIVES = /^(?=.*=)[a-z-]+(?:=[\w-]+)?(?:,\s*[a-z-]+(?:=[\w-]+)?)*$/u;

const ALLOWED_IN =
  /\.(?:test|stories)\.[jt]sx?$|[\\/]testing[\\/]|Route\.ts$|[\\/]server[\\/]src[\\/]db[\\/]/u;

type Place = 'quiet' | 'worded' | 'open';

const createRule = ESLintUtils.RuleCreator(() => 'https://valence.local/no-hard-coded-strings');

/**
 * Whether a piece of text is plainly for a machine: an identifier, a path, a list of directives
 * such as a cache policy, a style value such as a font stack, or a run of class names.
 *
 * @param text - The text.
 */
const readsAsCode = (text: string): boolean => {
  const trimmed = text.trim();

  if (
    STRING_KEY.test(trimmed) ||
    MEASURE.test(trimmed) ||
    DIRECTIVES.test(trimmed) ||
    STYLE_VALUE.test(trimmed) ||
    DISPOSITION.test(trimmed)
  ) {
    return true;
  }

  if (/^\p{Lu}\p{Ll}+\p{Lu}[\p{L}\d]*$|^[^\s]*[_/@#(-][^\s]*$/u.test(trimmed)) {
    return true;
  }

  return !/\p{Lu}/u.test(text) && !SENTENCE.test(text) && CLASSES.test(text);
};

/**
 * Whether a piece of text reads as words for a person rather than as a name for a machine.
 *
 * @param text - The text.
 */
/**
 * Whether a condition asks if a number is one, the way code picks between one of something and
 * several of it.
 *
 * @param test - The condition.
 */
const asksWhetherOne = (test: TSESTree.Expression): boolean =>
  test.type === AST_NODE_TYPES.BinaryExpression &&
  (test.operator === '===' || test.operator === '!==') &&
  [test.left, test.right].some((side) => side.type === AST_NODE_TYPES.Literal && side.value === 1);

/**
 * Whether the words written around a template's values read as a phrase for a person, such as
 * `${count} episodes` or `${time} left`, which a single lower-case word alone would not be taken
 * for. Each value stands as a number, so a unit written against one, such as `${width}px`, stays
 * code.
 *
 * @param node - The template.
 */
const wordsAroundValues = (node: TSESTree.TemplateLiteral): boolean => {
  const text = node.quasis.map((quasi) => quasi.value.cooked).join('0');

  return (
    !readsAsCode(text) && text.split(/\s+/u).some((token) => /^\p{Ll}{2,}[,.!?…:;]?$/u.test(token))
  );
};

const readsAsWords = (text: string): boolean => {
  if (!LETTER.test(text) || readsAsCode(text) || /^\p{Ll}[\p{Ll}\d]*[.!?]?$/u.test(text.trim())) {
    return false;
  }

  if (CAPITALISED.test(text) || SENTENCE.test(text)) {
    return true;
  }

  return text.split(/\s+/u).filter((token) => PLAIN_WORD.test(token)).length >= 2;
};

/**
 * The name a call is made by, whether it is called bare or as a method.
 *
 * @param callee - What is being called.
 */
const calledAs = (callee: TSESTree.Expression): { name: string | null; on: string | null } => {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return { name: callee.name, on: null };
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    const on =
      callee.object.type === AST_NODE_TYPES.Identifier
        ? callee.object.name
        : callee.object.type === AST_NODE_TYPES.ThisExpression
          ? 'this'
          : callee.object.type === AST_NODE_TYPES.MemberExpression &&
              callee.object.property.type === AST_NODE_TYPES.Identifier
            ? callee.object.property.name
            : null;

    return { name: callee.property.name, on };
  }

  return { name: null, on: null };
};

/**
 * The name of a property or attribute, where it is written plainly.
 *
 * @param key - The key.
 */
const nameOf = (key: TSESTree.Node): string | null => {
  if (key.type === AST_NODE_TYPES.Identifier || key.type === AST_NODE_TYPES.JSXIdentifier) {
    return key.name;
  }

  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string') {
    return key.value;
  }

  return null;
};

const NEVER_WORDS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ImportExpression,
  AST_NODE_TYPES.TSLiteralType,
  AST_NODE_TYPES.TSEnumMember,
  AST_NODE_TYPES.SwitchCase,
  AST_NODE_TYPES.TSExternalModuleReference,
  AST_NODE_TYPES.TaggedTemplateExpression,
]);

const PASSES_THROUGH = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ConditionalExpression,
  AST_NODE_TYPES.LogicalExpression,
  AST_NODE_TYPES.TemplateLiteral,
  AST_NODE_TYPES.JSXExpressionContainer,
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.ArrayExpression,
]);

/**
 * What one call makes of a string handed to it: nothing for a class name builder, a log line or a
 * method that only reads with it, and otherwise nothing it can say.
 *
 * @param call - The call.
 * @param child - The part of the call the string is in.
 */
const placeInACall = (call: TSESTree.CallExpression, child: TSESTree.Node): Place => {
  if (child === call.callee) {
    return 'open';
  }

  if (call.callee.type === AST_NODE_TYPES.Super) {
    return 'quiet';
  }

  const { name, on } = calledAs(call.callee);

  if (name === null) {
    return 'open';
  }

  if (on === null) {
    return QUIET_CALLS.has(name) ? 'quiet' : 'open';
  }

  return (QUIET_METHODS.has(name) && QUIET_OBJECTS.test(on)) ||
    READING_METHODS.has(name) ||
    on === 'headers'
    ? 'quiet'
    : 'open';
};

/**
 * What one step up from a string makes of it, or that it only passes the string on further up.
 *
 * @param parent - The step up.
 * @param child - Where the string came up from.
 */
const placeInAParent = (parent: TSESTree.Node, child: TSESTree.Node): Place | 'through' => {
  if (NEVER_WORDS.has(parent.type)) {
    return 'quiet';
  }

  if (PASSES_THROUGH.has(parent.type)) {
    return 'through';
  }

  if (parent.type === AST_NODE_TYPES.BinaryExpression) {
    return parent.operator === '+' ? 'through' : 'quiet';
  }

  if (parent.type === AST_NODE_TYPES.NewExpression) {
    return parent.callee.type === AST_NODE_TYPES.Identifier && parent.callee.name.endsWith('Error')
      ? 'quiet'
      : 'open';
  }

  if (parent.type === AST_NODE_TYPES.CallExpression) {
    return placeInACall(parent, child);
  }

  if (parent.type === AST_NODE_TYPES.Property) {
    const key = child === parent.key ? null : nameOf(parent.key);

    if (child === parent.key || (key !== null && (QUIET_KEYS.has(key) || HEADER_NAME.test(key)))) {
      return 'quiet';
    }

    return key !== null && WORDED_PROPS.has(key) ? 'worded' : 'open';
  }

  if (parent.type === AST_NODE_TYPES.JSXAttribute) {
    const key = nameOf(parent.name);

    if (key === null || QUIET_ATTRIBUTES.test(key)) {
      return 'quiet';
    }

    return WORDED_PROPS.has(key) ? 'worded' : 'open';
  }

  if (parent.type === AST_NODE_TYPES.MemberExpression) {
    return child === parent.property || nameOf(parent.property) === 'length' ? 'quiet' : 'open';
  }

  if (parent.type === AST_NODE_TYPES.AssignmentExpression) {
    return parent.left.type === AST_NODE_TYPES.MemberExpression &&
      nameOf(parent.left.property) === 'displayName'
      ? 'quiet'
      : 'open';
  }

  return 'open';
};

/**
 * Where a string sits, as far as whether it is words for a person: somewhere that never is, a
 * named place that always is, or neither, where only the words themselves can say.
 *
 * @param node - The string.
 */
const placeOf = (node: TSESTree.Node): Place => {
  let child: TSESTree.Node = node;
  let parent = node.parent;

  while (parent !== undefined) {
    const place = placeInAParent(parent, child);

    if (place !== 'through') {
      return place;
    }

    child = parent;
    parent = parent.parent;
  }

  return 'open';
};

const noHardCodedStrings = createRule({
  name: 'no-hard-coded-strings',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Words a person reads come from @valence/i18n, so that every one of them can be translated.',
    },
    messages: {
      words:
        'Words a person reads come from the strings file: say("{{ hint }}…") from @ValenceI18n/say, with the words added to packages/i18n/strings-en.json along with where they are used, then pnpm i18n:write.',
      counted:
        'Words that change with a number come from the strings file as a counted pair: sayCount("handler", count) from @ValenceI18n/sayCount, with handler.one and handler.other in packages/i18n/strings-en.json, then pnpm i18n:write.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: Readonly<TSESLint.RuleContext<'words' | 'counted', []>>) => {
    if (ALLOWED_IN.test(context.filename)) {
      return {};
    }

    const services = ESLintUtils.getParserServices(context, true);
    const checker = services.program?.getTypeChecker() ?? null;

    /**
     * Whether a string is one of the exact values its type allows, which makes it a key rather
     * than words: a lower-case member of a union of string literals, such as `'every library'`.
     *
     * @param node - The string.
     * @param text - What it says.
     */
    const isAChoiceOfItsType = (node: TSESTree.Literal, text: string): boolean => {
      if (checker === null || CAPITALISED.test(text)) {
        return false;
      }

      const type = checker.getContextualType(services.esTreeNodeToTSNodeMap.get(node));
      const members = type === undefined ? [] : type.isUnion() ? type.types : [type];

      return members.some((member) => member.isStringLiteral() && member.value === text);
    };

    const report = (node: TSESTree.Node, text: string): void => {
      context.report({ node, messageId: 'words', data: { hint: text.trim().slice(0, 24) } });
    };

    const look = (node: TSESTree.Node, text: string): void => {
      const place = placeOf(node);

      if (place === 'quiet') {
        return;
      }

      if (place === 'worded' ? LETTER.test(text) && !readsAsCode(text) : readsAsWords(text)) {
        report(node, text);
      }
    };

    /**
     * The words one branch of a choice says, or null where it says none: a literal whose type does
     * not make it a key, or a template, with each value in it standing as a number.
     *
     * @param branch - The branch.
     */
    const wordsOfBranch = (branch: TSESTree.Expression): string | null => {
      if (branch.type === AST_NODE_TYPES.Literal && typeof branch.value === 'string') {
        return isAChoiceOfItsType(branch, branch.value) ? null : branch.value;
      }

      return branch.type === AST_NODE_TYPES.TemplateLiteral
        ? branch.quasis.map((quasi) => quasi.value.cooked).join('0')
        : null;
    };

    return {
      ConditionalExpression: (node) => {
        if (!asksWhetherOne(node.test) || placeOf(node) === 'quiet') {
          return;
        }

        const said = [node.consequent, node.alternate].map(wordsOfBranch);

        if (said.some((text) => text !== null && LETTER.test(text) && !readsAsCode(text))) {
          context.report({ node, messageId: 'counted' });
        }
      },
      JSXText: (node) => {
        if (LETTER.test(node.value)) {
          report(node, node.value);
        }
      },
      Literal: (node) => {
        if (typeof node.value === 'string' && !isAChoiceOfItsType(node, node.value)) {
          look(node, node.value);
        }
      },
      TemplateLiteral: (node) => {
        const text = node.quasis.map((quasi) => quasi.value.cooked).join(' ');

        if (node.expressions.length > 0 && placeOf(node) !== 'quiet' && wordsAroundValues(node)) {
          report(node, text);

          return;
        }

        look(node, text);
      },
    };
  },
});

export { noHardCodedStrings };
