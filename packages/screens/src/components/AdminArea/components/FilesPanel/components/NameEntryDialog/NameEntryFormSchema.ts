import { z } from 'zod';
import { say } from '@ValenceI18n/say';

const NameEntryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: say('common.enterAName') }),
});

export { NameEntryFormSchema };
