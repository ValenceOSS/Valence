import { z } from 'zod';
import { MOST_NOTE_CHARACTERS } from '@ValenceContracts/schemas/LeftOut';
import { say } from '@ValenceI18n/say';

const LeaveOutFormSchema = z.object({
  note: z
    .string()
    .trim()
    .max(MOST_NOTE_CHARACTERS, { error: say('screens.banDialog.keepItShorter') })
    .transform((note) => (note === '' ? null : note)),
});

export { LeaveOutFormSchema };
