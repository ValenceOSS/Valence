import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import type { AccountDraft, AccountErrors } from './SetupWizard.types';
import { EMAIL_PATTERN } from '@ValenceContracts/constants/EMAIL_PATTERN';

/**
 * Checks the administrator's account before it reaches the server, so whoever is setting up is told
 * about a short password or a mistyped address as they go rather than after a round trip. The server
 * checks the same things again.
 *
 * @param draft - What has been filled in.
 * @returns What is wrong, by field, or nothing where the account is good.
 */
const validateAccount = (draft: AccountDraft): AccountErrors => ({
  ...(draft.name.trim() === ''
    ? { name: say('screens.setupWizard.validateSetupForm.enterANameForTheAdministrator') }
    : {}),
  ...(UsernameSchema.safeParse(draft.username).success
    ? {}
    : { username: say('error.setupLink.chooseAUsernameToSignInWith') }),
  ...(draft.email.trim() === '' || EMAIL_PATTERN.test(draft.email.trim())
    ? {}
    : { email: say('screens.setupWizard.validateSetupForm.enterAValidEmailAddress') }),
  ...(draft.password.length < MINIMUM_PASSWORD_LENGTH
    ? {
        password: say('screens.setupWizard.validateSetupForm.useAtLeastMINIMUMPASSWORDLENGTH', {
          MINIMUM_PASSWORD_LENGTH: MINIMUM_PASSWORD_LENGTH.toString(),
        }),
      }
    : {}),
  ...(draft.again === draft.password
    ? {}
    : { again: say('screens.resetPasswordPage.theTwoPasswordsAreNotThe') }),
});

export { validateAccount };
