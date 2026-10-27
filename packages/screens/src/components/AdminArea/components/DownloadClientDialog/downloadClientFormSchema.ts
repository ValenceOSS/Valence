import { z } from 'zod';
import { isWebAddress } from '@ValenceCore/functions/isWebAddress';
import { readWholeNumber } from '@ValenceCore/functions/readWholeNumber';
import {
  DOWNLOAD_CATEGORY_KINDS,
  DownloadClientKindSchema,
  DownloadClientPluginSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientDraft } from '@ValenceContracts/schemas/DownloadClient';
import { say } from '@ValenceI18n/say';

const CategoryFieldSchema = z.string().trim();

const downloadClientFormSchema = z
  .object({
    kind: DownloadClientKindSchema,
    plugin: DownloadClientPluginSchema.nullable(),
    name: z
      .string()
      .trim()
      .min(1, {
        error: say('screens.downloadClientDialog.readDownloadClientForm.giveTheClientAName'),
      }),
    url: z.string().trim(),
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
      .refine(
        (categories) =>
          DOWNLOAD_CATEGORY_KINDS.every((kind) => /^[\w .-]+$/.test(categories[kind])),
        {
          error: say(
            'screens.downloadClientDialog.readDownloadClientForm.aCategoryIsLettersNumbersSpaces',
          ),
        },
      )
      .refine(
        (categories) =>
          new Set(DOWNLOAD_CATEGORY_KINDS.map((kind) => categories[kind].toLowerCase())).size ===
          DOWNLOAD_CATEGORY_KINDS.length,
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
  .refine((form) => form.kind === 'plugin' || isWebAddress(form.url), {
    error: say('common.theAddressNeedsToBeA'),
    path: ['url'],
  })
  .refine((form) => form.kind !== 'plugin' || form.plugin !== null, {
    error: say('contracts.schemas.downloadClient.chooseWhichPluginSendsTheDownloads'),
    path: ['plugin'],
  })
  .refine((form) => form.kind !== 'plugin' || form.localPath !== '', {
    error: say('contracts.schemas.downloadClient.enterTheFolderThisClientSaves'),
    path: ['localPath'],
  })
  .refine(
    (form) => form.kind === 'plugin' || (form.remotePath === '') === (form.localPath === ''),
    {
      error: say(
        'screens.downloadClientDialog.readDownloadClientForm.sayWhereTheDownloadsFolderIs',
      ),
      path: ['localPath'],
    },
  )
  .transform((form): DownloadClientDraft => {
    const isSabnzbd = form.kind === 'sabnzbd';
    const isPlugin = form.kind === 'plugin';

    return {
      kind: form.kind,
      plugin: isPlugin ? form.plugin : null,
      name: form.name,
      url: isPlugin ? '' : form.url,
      username: isSabnzbd || isPlugin ? '' : form.username,
      password: isSabnzbd || isPlugin ? '' : form.password,
      apiKey: isSabnzbd ? form.apiKey : '',
      categories: form.categories,
      remotePath: isPlugin ? '' : form.remotePath,
      localPath: form.localPath,
      priority: readWholeNumber(form.priority, 1, 50) ?? 1,
      isEnabled: form.isEnabled,
    };
  });

export { downloadClientFormSchema };
