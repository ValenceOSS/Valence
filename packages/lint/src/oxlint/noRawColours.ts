import { defineRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

const RAW_UTILITY =
  /\b(?:bg|text|border|ring|divide|from|via|to|fill|stroke|shadow|outline|accent|caret|decoration)-(?:white|black)(?:\/\d{1,3}|\/\[[^\]]+\])?\b/u;

const RAW_VALUE = /(?:#[0-9a-fA-F]{3,8}\b|(?<![a-zA-Z])(?:rgba?|hsla?|oklch|oklab)\()/u;

const ALLOWED_IN = /\.(?:test|stories)\.[jt]sx?$|[\\/]styles[\\/]|[\\/]tokens[\\/]/u;

/**
 * Reads a string literal or a template chunk, whichever the node happens to be.
 *
 * @param node - The node to read.
 * @returns Its text.
 */
const textOf = (node: ESTree.StringLiteral | ESTree.TemplateElement): string =>
  node.type === 'TemplateElement' ? node.value.raw : node.value;

const noRawColours = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Colours come from the palette, so that both themes are drawn by one set of rules.',
    },
    messages: {
      utility:
        'Use a palette class rather than {{ found }}. A colour written into a component is a colour only one theme is right about — see the tokens in valence.css.',
      value:
        'Use a palette class rather than the literal colour {{ found }}. Anything the palette cannot say yet belongs in valence.css as a token.',
    },
    schema: [],
  },
  create: (context) => {
    if (ALLOWED_IN.test(context.filename)) {
      return {};
    }

    const look = (node: ESTree.StringLiteral | ESTree.TemplateElement): void => {
      const text = textOf(node);
      const utility = RAW_UTILITY.exec(text);

      if (utility !== null) {
        context.report({ node, messageId: 'utility', data: { found: utility[0] } });

        return;
      }

      const value = RAW_VALUE.exec(text);

      if (value !== null) {
        context.report({ node, messageId: 'value', data: { found: value[0] } });
      }
    };

    return {
      Literal: (node) => {
        if (typeof node.value === 'string') {
          look(node);
        }
      },
      TemplateElement: look,
    };
  },
});

export { noRawColours };
