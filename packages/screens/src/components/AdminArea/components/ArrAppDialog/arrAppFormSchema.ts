import { z } from 'zod';
import { isWebAddress } from '@ValenceCore/functions/isWebAddress';
import { ArrAppKindSchema } from '@ValenceContracts/schemas/ArrApp';
import type { ArrAppDraft } from '@ValenceContracts/schemas/ArrApp';
import { say } from '@ValenceI18n/say';

/**
 * What a Radarr, Sonarr, Lidarr or Prowlarr to connect must be, and the words to say where it is
 * not: a name, an address that is a web address, its key unless one is kept already, and a folder
 * mapping given both ways or neither.
 *
 * @param hasKey - Whether the app being changed has a key kept already, so one need not be typed.
 * @returns The schema, which reads the form into the app to connect or try.
 */
const arrAppFormSchema = (hasKey: boolean) =>
  z
    .object({
      kind: ArrAppKindSchema,
      name: z
        .string()
        .trim()
        .min(1, { error: say('screens.adminArea.arrAppDialog.giveTheAppAName') }),
      url: z
        .string()
        .trim()
        .refine(isWebAddress, {
          error: say('common.theAddressNeedsToBeA'),
        }),
      apiKey: z.string().trim(),
      remotePath: z.string().trim(),
      localPath: z.string().trim(),
      isEnabled: z.boolean(),
    })
    .refine((form) => form.apiKey !== '' || hasKey, {
      error: say('screens.adminArea.arrAppDialog.itNeedsItsApiKey'),
      path: ['apiKey'],
    })
    .refine((form) => (form.remotePath === '') === (form.localPath === ''), {
      error: say('screens.adminArea.arrAppDialog.sayWhereItsLibraryIsBothWays'),
      path: ['localPath'],
    })
    .transform((form): ArrAppDraft => ({
      kind: form.kind,
      name: form.name,
      url: form.url,
      apiKey: form.apiKey,
      remotePath: form.remotePath,
      localPath: form.localPath,
      isEnabled: form.isEnabled,
    }));

export { arrAppFormSchema };
