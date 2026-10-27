import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { Likeness } from './Likeness';

const CAST_COMPARED = 15;

// oxlint-disable-next-line valence/no-hard-coded-strings -- the catalogue's names for crew jobs, matched rather than read
const MAKERS = new Set(['Director', 'Screenplay', 'Writer']);

const NamedSchema = z.object({ id: z.number().int().positive().nullish() });

const NamedListSchema = z.array(NamedSchema).catch([]);

const LikenessResponseSchema = z.object({
  genres: NamedListSchema.default([]),
  keywords: z
    .object({ keywords: NamedListSchema.optional(), results: NamedListSchema.optional() })
    .catch({}),
  recommendations: z.object({ results: NamedListSchema.default([]) }).catch({ results: [] }),
  created_by: NamedListSchema.default([]),
  credits: z
    .object({
      cast: NamedListSchema.default([]),
      crew: z
        .array(z.object({ id: z.number().int().positive().nullish(), job: z.string().nullish() }))
        .catch([])
        .default([]),
    })
    .catch({ cast: [], crew: [] }),
});

/**
 * Lists the identifiers in a catalogue list, once each and in the order given, leaving out any
 * entry without one.
 *
 * @param named - The entries.
 * @returns Their identifiers.
 */
const idsOf = (named: readonly { id?: number | null | undefined }[]): number[] => [
  ...new Set(named.flatMap((one) => (one.id === null || one.id === undefined ? [] : [one.id]))),
];

/**
 * Reads what makes a title like another out of the catalogue's record of it: its genres and
 * keywords, its top-billed cast, who directed, wrote or created it, and the titles the catalogue recommends
 * beside it.
 *
 * @param answer - The catalogue's record, with keywords, credits and recommendations appended.
 * @returns The likeness, or null where the answer is not a record at all.
 */
const likenessIn = (answer: JsonValue): Likeness | null => {
  const read = LikenessResponseSchema.safeParse(answer);

  if (!read.success) {
    return null;
  }

  const { genres, keywords, recommendations, created_by: createdBy, credits } = read.data;

  return {
    genres: idsOf(genres),
    keywords: idsOf(keywords.keywords ?? keywords.results ?? []),
    cast: idsOf(credits.cast).slice(0, CAST_COMPARED),
    crew: idsOf([...createdBy, ...credits.crew.filter((member) => MAKERS.has(member.job ?? ''))]),
    recommendations: idsOf(recommendations.results),
  };
};

export { CAST_COMPARED, likenessIn };
