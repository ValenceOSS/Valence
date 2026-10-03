import { z } from 'zod';
import { isWebAddress } from '@ValenceCore/functions/isWebAddress';
import { readWholeNumber } from '@ValenceCore/functions/readWholeNumber';
import { DownloadClientKindSchema } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientDraft } from '@ValenceContracts/schemas/DownloadClient';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const CategoryFieldSchema = z.string().trim();

const downloadClientFormSchema = z
  .object({
    kind: DownloadClientKindSchema,
    name: z
      .string()
      .trim()
      .min(1, {
        error: say('screens.downloadClientDialog.readDownloadClientForm.giveTheClientAName'),
      }),
    url: z
      .string()
      .trim()
      .refine(isWebAddress, {
        error: say('common.theAddressNeedsToBeA'),
      }),
    username: z.string().trim(),
    password: z.string(),
    apiKey: z.string().trim(),
    categories: z
      .object({
        movies: CategoryFieldSchema,
        shows: CategoryFieldSchema,
        music: CategoryFieldSchema,
        books: CategoryFieldSchema,
      })
      .refine((categories) => LIBRARY_KINDS.every((kind) => /^[\w .-]+$/.test(categories[kind])), {
        error: say(
          'screens.downloadClientDialog.readDownloadClientForm.aCategoryIsLettersNumbersSpaces',
        ),
      })
      .refine(
        (categories) =>
          new Set(LIBRARY_KINDS.map((kind) => categories[kind].toLowerCase())).size ===
          LIBRARY_KINDS.length,
        {
          error: say(
            'screens.downloadClientDialog.readDownloadClientForm.eachKindNeedsACategoryOf',
          ),
        },
      ),
    remotePath: z.string().trim(),
    localPath: z.string().trim(),
    priority: z.string().refine((priority) => readWholeNumber(priority, 1, 50) !== null, {
      error: say('common.priorityIsAWholeNumberFrom'),
    }),
    isEnabled: z.boolean(),
  })
  .refine((form) => (form.remotePath === '') === (form.localPath === ''), {
    error: say('screens.downloadClientDialog.readDownloadClientForm.sayWhereTheDownloadsFolderIs'),
    path: ['localPath'],
  })
  .transform((form): DownloadClientDraft => {
    const isSabnzbd = form.kind === 'sabnzbd';

    return {
      kind: form.kind,
      name: form.name,
      url: form.url,
      username: isSabnzbd ? '' : form.username,
      password: isSabnzbd ? '' : form.password,
      apiKey: isSabnzbd ? form.apiKey : '',
      categories: form.categories,
      remotePath: form.remotePath,
      localPath: form.localPath,
      priority: readWholeNumber(form.priority, 1, 50) ?? 1,
      isEnabled: form.isEnabled,
    };
  });

export { downloadClientFormSchema };
