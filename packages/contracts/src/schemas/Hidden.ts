import { z } from 'zod';

const HIDDEN_KINDS = ['item', 'series', 'library'] as const;

const HiddenKindSchema = z.enum(HIDDEN_KINDS);

const HiddenSchema = z.object({
  kind: HiddenKindSchema,
  subjectId: z.string().uuid(),
  title: z.string(),
  hiddenAt: z.string().datetime(),
});

const HiddenListSchema = z.object({ hidden: z.array(HiddenSchema) });

type HiddenKind = z.infer<typeof HiddenKindSchema>;
type Hidden = z.infer<typeof HiddenSchema>;

/**
 * Where a subject's hiding is reached, so a film, a programme and a whole library are asked about in
 * the same way at three different paths rather than through three near-identical functions.
 *
 * The three sit under the addresses those things already have rather than under one of their own,
 * which is what puts the two that name an item behind the server's existing refusal of anything out
 * of reach: nobody can hide what they were never allowed to see.
 *
 * @param subject - What is being hidden or brought back.
 * @returns Where its hiding lives.
 */
const hiddenAddressOf = (subject: { kind: HiddenKind; subjectId: string }): string => {
  const root =
    subject.kind === 'item' ? 'media' : subject.kind === 'series' ? 'series' : 'libraries';

  return `/api/${root}/${subject.subjectId}/hidden`;
};

export type { Hidden, HiddenKind };

export { HIDDEN_KINDS, HiddenKindSchema, HiddenSchema, HiddenListSchema, hiddenAddressOf };
