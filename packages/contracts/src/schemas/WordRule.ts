import { z } from 'zod';

const WordRuleSchema = z.object({
  field: z.literal('genres'),
  find: z.string().trim().min(1).max(64),
  replace: z.string().trim().max(64),
});

const WordRulesSchema = z.object({ rules: z.array(WordRuleSchema).max(200) });

type WordRule = z.infer<typeof WordRuleSchema>;

export type { WordRule };

export { WordRuleSchema, WordRulesSchema };
