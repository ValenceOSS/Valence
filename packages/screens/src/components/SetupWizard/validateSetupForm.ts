import type { SetupFormErrors } from './SetupWizard.types';
import { say } from '@ValenceI18n/say';

const MINIMUM_PASSWORD_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SetupFormValues = {
  name: string;
  email: string;
  password: string;
  trustedOrigins: string;
};

/**
 * Reads a comma-separated list of origins out of the field they are typed into, dropping the spaces
 * people put after commas and the empty entries left by a trailing one.
 *
 * @param raw - What the field holds.
 * @returns The origins named.
 */
const parseOrigins = (raw: string): string[] =>
  raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

/**
 * Checks the first-run form before it reaches the server, so somebody filling it in is told about a
 * short password or a malformed origin as they type rather than after a round trip. The server
 * checks the same things again; this exists for the speed of the answer, not for the safety.
 *
 * @param values - What has been filled in.
 * @returns What is wrong, by field, or nothing where the form is good.
 */
const validateSetupForm = (values: SetupFormValues): SetupFormErrors => {
  const errors: SetupFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = say('screens.setupWizard.validateSetupForm.enterANameForTheAdministrator');
  }

  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = say('screens.setupWizard.validateSetupForm.enterAValidEmailAddress');
  }

  if (values.password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = say('screens.setupWizard.validateSetupForm.useAtLeastMINIMUMPASSWORDLENGTH', {
      MINIMUM_PASSWORD_LENGTH: MINIMUM_PASSWORD_LENGTH.toString(),
    });
  }

  const origins = parseOrigins(values.trustedOrigins);

  if (origins.length === 0) {
    errors.trustedOrigins = say('screens.setupWizard.validateSetupForm.enterAtLeastOneOrigin');
  } else if (origins.some((origin) => URL.parse(origin) === null)) {
    errors.trustedOrigins = say('screens.setupWizard.validateSetupForm.eachOriginMustBeAFull');
  }

  return errors;
};

export { validateSetupForm, parseOrigins };
