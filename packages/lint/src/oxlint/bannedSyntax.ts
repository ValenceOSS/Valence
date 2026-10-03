import { defineRule } from '@oxlint/plugins';
import { z } from 'zod';
import type { ESTree, Visitor } from '@oxlint/plugins';

const BansSchema = z.array(z.object({ selector: z.string().min(1), message: z.string().min(1) }));

const bannedSyntax = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bans whatever the selectors it is given match, each with its own reason — the coding standard’s bans that no rule names.',
    },
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { selector: { type: 'string' }, message: { type: 'string' } },
        required: ['selector', 'message'],
        additionalProperties: false,
      },
    },
  },
  create: (context) => {
    const visitor: Visitor = {};

    for (const { selector, message } of BansSchema.parse(context.options)) {
      const before = visitor[selector];

      visitor[selector] = (node: ESTree.Node) => {
        before?.(node);
        context.report({ node, message });
      };
    }

    return visitor;
  },
});

export { bannedSyntax };
