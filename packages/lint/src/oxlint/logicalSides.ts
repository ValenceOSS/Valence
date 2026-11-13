import { defineRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

const VALUE = String.raw`(?:\d+(?:\.\d+)?|px|full|auto|\[[^\]\s]+\]|\([^)\s]+\)|1/3|2/3|1/4|3/4)`;

const BEFORE = String.raw`(?<=^|[\s:!(\[{,])`;

const PHYSICAL = new RegExp(
  [
    String.raw`${BEFORE}-?(?:m|p|scroll-m|scroll-p)[lr]-${VALUE}(?![\w/])`,
    String.raw`${BEFORE}-?(?:left|right)-${VALUE}(?![\w/])`,
    String.raw`${BEFORE}(?:text|float)-(?:left|right)(?![\w-])`,
    String.raw`${BEFORE}rounded-[tb]?[lr](?=-|\s|$)`,
    String.raw`${BEFORE}border-[lr](?=-|\s|$)`,
  ].join('|'),
  'u',
);

const ALLOWED_IN = /\.(?:test|stories)\.[jt]sx?$/u;

/**
 * Reads a string literal or a template chunk, whichever the node happens to be.
 *
 * @param node - The node to read.
 * @returns Its text.
 */
const textOf = (node: ESTree.StringLiteral | ESTree.TemplateElement): string =>
  node.type === 'TemplateElement' ? node.value.raw : node.value;

const logicalSides = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Spacing, edges and alignment follow the line of text, so a page read right to left mirrors itself.',
    },
    messages: {
      physical:
        'Use the start or end form of {{ found }} (ms/me, ps/pe, start/end, text-start, rounded-s, border-e…), so the layout mirrors for Arabic and Hebrew. A centring pair such as left-1/2 with -translate-x-1/2 is fine as it is.',
    },
    schema: [],
  },
  create: (context) => {
    if (ALLOWED_IN.test(context.filename)) {
      return {};
    }

    const look = (node: ESTree.StringLiteral | ESTree.TemplateElement): void => {
      const found = PHYSICAL.exec(textOf(node));

      if (found !== null) {
        context.report({ node, messageId: 'physical', data: { found: found[0] } });
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

export { logicalSides };
