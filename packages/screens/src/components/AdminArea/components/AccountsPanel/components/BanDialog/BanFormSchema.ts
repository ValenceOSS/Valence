import { z } from 'zod';
import { say } from '@ValenceI18n/say';

const MOST_REASON_CHARACTERS = 200;

const BanFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { error: say('common.sayWhy') })
    .max(MOST_REASON_CHARACTERS, { error: say('screens.banDialog.keepItShorter') }),
});

export { BanFormSchema };
