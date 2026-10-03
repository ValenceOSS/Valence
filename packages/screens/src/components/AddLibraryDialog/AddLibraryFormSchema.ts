import { z } from 'zod';
import { LibraryKindSchema } from '@ValenceContracts/schemas/Library';
import { CUSTOM_PRESET } from './CUSTOM_PRESET';
import { say } from '@ValenceI18n/say';

const AddLibraryFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, {
        error: say('screens.addLibraryDialog.validateAddLibraryForm.enterANameForThisLibrary'),
      }),
    preset: z.string(),
    customKind: LibraryKindSchema,
    flavour: z.string().trim(),
    path: z
      .string()
      .trim()
      .min(1, {
        error: say('screens.addLibraryDialog.validateAddLibraryForm.enterThePathToThisLibrary'),
      }),
  })
  .refine((form) => form.preset !== CUSTOM_PRESET || form.flavour !== '', {
    error: say('screens.addLibraryDialog.validateAddLibraryForm.sayWhatKindOfLibraryThis'),
    path: ['flavour'],
  });

export { AddLibraryFormSchema };
