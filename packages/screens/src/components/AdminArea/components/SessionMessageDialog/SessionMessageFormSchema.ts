import { z } from 'zod';
import { SESSION_MESSAGE_MAX_LENGTH } from '@ValenceContracts/schemas/SessionMessage';
import { say } from '@ValenceI18n/say';

const SessionMessageFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { error: say('screens.adminArea.sessionMessageDialog.writeWhatToTellThem') })
    .max(SESSION_MESSAGE_MAX_LENGTH, {
      error: say('screens.adminArea.sessionMessageDialog.thatIsTooLongToFit'),
    }),
});

export { SessionMessageFormSchema };
