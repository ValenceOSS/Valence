import { z } from 'zod';
import { isWebAddress } from '@ValenceCore/functions/isWebAddress';
import { readWholeNumber } from '@ValenceCore/functions/readWholeNumber';
import { IndexerKindSchema, IndexerSettingsSchema } from '@ValenceContracts/schemas/Indexer';
import type { IndexerDraft, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import { say } from '@ValenceI18n/say';

/**
 * What an indexer to add or try must be, and the words to say where it is not, with the site's own
 * address and setting defaults filled in where nothing was typed, as the definition it was chosen
 * from says they should be.
 *
 * @param fallbackUrl - The address to use where none was typed, the site's first, or empty.
 * @param settingDefaults - The value each of the site's settings starts with.
 * @returns The schema, which reads the form into the indexer to add or try.
 */
const indexerFormSchema = (fallbackUrl: string, settingDefaults: IndexerSettings) =>
  z
    .object({
      kind: IndexerKindSchema,
      name: z
        .string()
        .trim()
        .min(1, { error: say('screens.indexerDialog.readIndexerForm.giveTheIndexerAName') }),
      url: z
        .string()
        .trim()
        .transform((url) => (url === '' ? fallbackUrl : url))
        .refine(isWebAddress, { error: say('common.theAddressNeedsToBeA') }),
      apiKey: z.string().trim(),
      priority: z.string().refine((priority) => readWholeNumber(priority, 1, 50) !== null, {
        error: say('common.priorityIsAWholeNumberFrom'),
      }),
      requestsPerMinute: z
        .string()
        .trim()
        .refine((limit) => limit === '' || readWholeNumber(limit, 1, 600) !== null, {
          error: say('screens.indexerDialog.readIndexerForm.theLimitIsAWholeNumber'),
        }),
      timeoutSeconds: z.string().refine((wait) => readWholeNumber(wait, 5, 120) !== null, {
        error: say('screens.indexerDialog.readIndexerForm.waitBetween5And120Seconds'),
      }),
      isEnabled: z.boolean(),
      categories: z.array(z.number()),
      definitionId: z.string().nullable(),
      settings: IndexerSettingsSchema,
      removesWhenDone: z.enum(['tracker', 'always', 'never']),
      seedSeconds: z
        .string()
        .trim()
        .refine((seed) => seed === '' || readWholeNumber(seed, 0, 31_536_000) !== null, {
          error: say('screens.indexerDialog.readIndexerForm.seedTimeIsAWholeNumber'),
        }),
      seedRatio: z
        .string()
        .trim()
        .refine(
          (ratio) =>
            ratio === '' ||
            (Number.isFinite(Number(ratio)) && Number(ratio) >= 0 && Number(ratio) <= 1000),
          { error: say('screens.indexerDialog.readIndexerForm.aRatioIsANumberFrom') },
        ),
    })
    .transform((form): IndexerDraft => ({
      kind: form.kind,
      name: form.name,
      url: form.url,
      apiKey: form.apiKey,
      priority: readWholeNumber(form.priority, 1, 50) ?? 25,
      requestsPerMinute:
        form.requestsPerMinute === '' ? null : readWholeNumber(form.requestsPerMinute, 1, 600),
      timeoutSeconds: readWholeNumber(form.timeoutSeconds, 5, 120) ?? 30,
      isEnabled: form.isEnabled,
      categories: form.categories,
      definitionId: form.kind === 'cardigann' ? form.definitionId : null,
      settings: form.kind === 'cardigann' ? { ...settingDefaults, ...form.settings } : {},
      removesWhenDone:
        form.removesWhenDone === 'tracker' ? null : form.removesWhenDone === 'always',
      seedSeconds:
        form.seedSeconds === '' ? null : readWholeNumber(form.seedSeconds, 0, 31_536_000),
      seedRatio: form.seedRatio === '' ? null : Number(form.seedRatio),
    }));

export { indexerFormSchema };
