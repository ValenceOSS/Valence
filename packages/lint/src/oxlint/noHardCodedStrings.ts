import { defineRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

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

const LOWER_CASE_WORD = /^\p{Ll}{2,}$/u;

const SCHEMA_METHODS = new Set(['onDelete', 'onUpdate']);

const MEASURE = /^[\d.,]+\s?(?:p|K|k|i|MB|GB|TB|kbps|Mbps|fps|Hz|kHz|x|ms|s)$/u;

const STYLE_VALUE =
  /^[a-z][\w-]*\(|(?:^|,\s*)(?:serif|sans-serif|monospace|cursive|system-ui|ui-serif|ui-monospace)$/u;

const DISPOSITION = /^(?:attachment|inline);/u;

const DIRECTIVES = /^(?=.*=)[a-z-]+(?:=[\w-]+)?(?:,\s*[a-z-]+(?:=[\w-]+)?)*$/u;

const ALLOWED_IN =
  /\.(?:test|stories)\.[jt]sx?$|[\\/]testing[\\/]|Route\.ts$|[\\/]server[\\/]src[\\/]db[\\/]/u;

type Place = 'quiet' | 'worded' | 'open';

/**
 * Whether a piece of text is plainly for a machine: an identifier, a name run into a number such
 * as a curve or a codec, a path, a list of directives such as a cache policy, a style value such
 * as a font stack, or a run of class names.
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

  if (/^\p{Lu}\p{Ll}+\p{Lu}[\p{L}\d]*$|^\p{L}+\d+$|^[^\s]*[_/@#(-][^\s]*$/u.test(trimmed)) {
    return true;
  }

  return !/\p{Lu}/u.test(text) && !SENTENCE.test(text) && CLASSES.test(text);
};

/**
 * Whether a condition asks if a number is one, the way code picks between one of something and
 * several of it.
 *
 * @param test - The condition.
 */
const asksWhetherOne = (test: ESTree.Expression): boolean =>
  test.type === 'BinaryExpression' &&
  (test.operator === '===' || test.operator === '!==') &&
  [test.left, test.right].some((side) => side.type === 'Literal' && side.value === 1);

/**
 * Whether the words written around a template's values read as a phrase for a person, such as
 * `${count} episodes` or `${time} left`, which a single lower-case word alone would not be taken
 * for. Each value stands as a number, so a unit written against one, such as `${width}px`, stays
 * code.
 *
 * @param node - The template.
 */
const wordsAroundValues = (node: ESTree.TemplateLiteral): boolean => {
  const text = node.quasis.map((quasi) => quasi.value.cooked).join('0');

  return (
    !readsAsCode(text) && text.split(/\s+/u).some((token) => /^\p{Ll}{2,}[,.!?…:;]?$/u.test(token))
  );
};

/**
 * Whether a piece of text reads as words for a person rather than as a name for a machine.
 *
 * @param text - The text.
 */
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
const calledAs = (callee: ESTree.Expression): { name: string | null; on: string | null } => {
  if (callee.type === 'Identifier') {
    return { name: callee.name, on: null };
  }

  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    const on =
      callee.object.type === 'Identifier'
        ? callee.object.name
        : callee.object.type === 'ThisExpression'
          ? 'this'
          : callee.object.type === 'MemberExpression' &&
              callee.object.property.type === 'Identifier'
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
const nameOf = (key: ESTree.Node): string | null => {
  if (key.type === 'Identifier' || key.type === 'JSXIdentifier') {
    return key.name;
  }

  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }

  return null;
};

const NEVER_WORDS = new Set<string>([
  'ImportDeclaration',
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportExpression',
  'TSLiteralType',
  'TSEnumMember',
  'SwitchCase',
  'TSExternalModuleReference',
  'TaggedTemplateExpression',
]);

const PASSES_THROUGH = new Set<string>([
  'ConditionalExpression',
  'LogicalExpression',
  'TemplateLiteral',
  'JSXExpressionContainer',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'ArrayExpression',
]);

/**
 * What one call makes of a string handed to it: nothing for a class name builder, a log line or a
 * method that only reads with it, and otherwise nothing it can say.
 *
 * @param call - The call.
 * @param child - The part of the call the string is in.
 */
const placeInACall = (call: ESTree.CallExpression, child: ESTree.Node): Place => {
  if (child === call.callee) {
    return 'open';
  }

  if (call.callee.type === 'Super') {
    return 'quiet';
  }

  const { name, on } = calledAs(call.callee);

  if (name === null) {
    return 'open';
  }

  if (SCHEMA_METHODS.has(name)) {
    return 'quiet';
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
const placeInAParent = (parent: ESTree.Node, child: ESTree.Node): Place | 'through' => {
  if (NEVER_WORDS.has(parent.type)) {
    return 'quiet';
  }

  if (PASSES_THROUGH.has(parent.type)) {
    return 'through';
  }

  if (parent.type === 'BinaryExpression') {
    return parent.operator === '+' ? 'through' : 'quiet';
  }

  if (parent.type === 'NewExpression') {
    return parent.callee.type === 'Identifier' && parent.callee.name.endsWith('Error')
      ? 'quiet'
      : 'open';
  }

  if (parent.type === 'CallExpression') {
    return placeInACall(parent, child);
  }

  if (parent.type === 'Property') {
    const key = child === parent.key ? null : nameOf(parent.key);

    if (child === parent.key || (key !== null && (QUIET_KEYS.has(key) || HEADER_NAME.test(key)))) {
      return 'quiet';
    }

    return key !== null && WORDED_PROPS.has(key) ? 'worded' : 'open';
  }

  if (parent.type === 'JSXAttribute') {
    const key = nameOf(parent.name);

    if (key === null || QUIET_ATTRIBUTES.test(key)) {
      return 'quiet';
    }

    return WORDED_PROPS.has(key) ? 'worded' : 'open';
  }

  if (parent.type === 'MemberExpression') {
    return child === parent.property || nameOf(parent.property) === 'length' ? 'quiet' : 'open';
  }

  if (parent.type === 'AssignmentExpression') {
    return parent.left.type === 'MemberExpression' && nameOf(parent.left.property) === 'displayName'
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
const placeOf = (node: ESTree.Node): Place => {
  let child: ESTree.Node = node;
  let parent = node.parent;

  while (parent !== null) {
    const place = placeInAParent(parent, child);

    if (place !== 'through') {
      return place;
    }

    child = parent;
    parent = parent.parent;
  }

  return 'open';
};

const noHardCodedStrings = defineRule({
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
  create: (context) => {
    if (ALLOWED_IN.test(context.filename)) {
      return {};
    }

    const report = (node: ESTree.Node, text: string): void => {
      context.report({ node, messageId: 'words', data: { hint: text.trim().slice(0, 24) } });
    };

    const look = (node: ESTree.Node, text: string): void => {
      const place = placeOf(node);

      if (place === 'quiet') {
        return;
      }

      if (place === 'worded' ? LETTER.test(text) && !readsAsCode(text) : readsAsWords(text)) {
        report(node, text);
      }
    };

    /**
     * The words one branch of a choice says, or null where it says none: a literal, or a template
     * with each value in it standing as a number. A branch that is one lower-case word is a key, such
     * as a variant, rather than words that change with the number.
     *
     * @param branch - The branch.
     */
    const wordsOfBranch = (branch: ESTree.Expression): string | null => {
      if (branch.type === 'Literal' && typeof branch.value === 'string') {
        return branch.value;
      }

      return branch.type === 'TemplateLiteral'
        ? branch.quasis.map((quasi) => quasi.value.cooked).join('0')
        : null;
    };

    return {
      ConditionalExpression: (node) => {
        if (!asksWhetherOne(node.test) || placeOf(node) === 'quiet') {
          return;
        }

        const said = [node.consequent, node.alternate].map(wordsOfBranch);

        if (
          said.some(
            (text) =>
              text !== null &&
              LETTER.test(text) &&
              !readsAsCode(text) &&
              !LOWER_CASE_WORD.test(text.trim()),
          )
        ) {
          context.report({ node, messageId: 'counted' });
        }
      },
      JSXText: (node) => {
        if (LETTER.test(node.value)) {
          report(node, node.value);
        }
      },
      Literal: (node) => {
        if (typeof node.value === 'string') {
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
