import { z } from 'zod';
import { EMAIL_PATTERN } from '@ValenceContracts/constants/EMAIL_PATTERN';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { SetupLinkLifetimeSchema, UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const AddAccountFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: say('common.enterAName') }),
    username: z
      .string()
      .trim()
      .superRefine((username, context) => {
        const checked = UsernameSchema.safeParse(username);

        if (username !== '' && !checked.success) {
          for (const issue of checked.error.issues) {
            context.addIssue({ code: 'custom', message: issue.message });
          }
        }
      }),
    email: z
      .string()
      .trim()
      .refine((email) => email === '' || EMAIL_PATTERN.test(email), {
        error: say('screens.addAccountDialog.thatIsNotAnEmailAddress'),
      }),
    way: z.enum(['link', 'password']),
    password: z.string(),
    lifetime: SetupLinkLifetimeSchema,
  })
  .refine((form) => form.way === 'link' || form.password.length >= MINIMUM_PASSWORD_LENGTH, {
    error: sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH),
    path: ['password'],
  });

export { AddAccountFormSchema };
