import { useId, useState } from 'react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import { validateAccount } from '@ValenceScreens/components/SetupWizard/validateAccount';
import { UsernameField } from '@ValenceScreens/components/UsernameField/UsernameField';
import type { AccountStepProps } from './AccountStep.types';

/**
 * The administrator's own account: their name, the username they sign in with, an address for
 * password resets if they want them, and a password typed twice. Nothing is made yet; the account is
 * made once the next step says how the server is reached. Each field's explanation sits under it,
 * so fields side by side line up whatever each one says.
 *
 * @param draft - What has been filled in so far.
 * @param onChange - Told as any of it changes.
 * @param onBack - Told to go back to the welcome.
 * @param onContinue - Told to go on, once the account is good.
 */
const AccountStep = ({ draft, onChange, onBack, onContinue }: AccountStepProps) => {
  const formId = useId();
  const [hasTried, setHasTried] = useState(false);
  const errors = validateAccount(draft);
  const shown = hasTried ? errors : {};
  const isGood = Object.keys(errors).length === 0;

  const change = (field: keyof typeof draft) => (value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <SetupStepFrame
      title={say('screens.accountDialog.yourAccount')}
      lead={say('screens.setupWizard.accountStep.thisIsTheAdministrator')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <Button type="submit" form={formId} variant="confirm" size="lg">
          {say('common.continue')}
          <Icon of={ArrowRightIcon} size={16} />
        </Button>
      }
    >
      <form
        id={formId}
        noValidate
        className="grid items-start gap-x-5 gap-y-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setHasTried(true);

          if (isGood) {
            onContinue();
          }
        }}
      >
        <TextField
          label={say('common.name')}
          value={draft.name}
          onValueChange={change('name')}
          autoComplete="name"
          hasFocusOnMount
          descriptionPlacement="below"
          {...(shown.name === undefined ? {} : { error: shown.name })}
        />

        <UsernameField
          value={draft.username}
          onValueChange={change('username')}
          checksAvailability={false}
          autoComplete="username"
          descriptionPlacement="below"
          {...(shown.username === undefined ? {} : { problem: shown.username })}
        />

        <TextField
          label={say('screens.addAccountDialog.emailOptional')}
          type="email"
          value={draft.email}
          onValueChange={change('email')}
          autoComplete="email"
          description={say('screens.setupWizard.accountStep.onlyForAPasswordResetLink')}
          descriptionPlacement="below"
          className="sm:col-span-2"
          {...(shown.email === undefined ? {} : { error: shown.email })}
        />

        <TextField
          label={say('common.password')}
          type="password"
          value={draft.password}
          onValueChange={change('password')}
          autoComplete="new-password"
          description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
          descriptionPlacement="below"
          {...(shown.password === undefined ? {} : { error: shown.password })}
        />

        <TextField
          label={say('screens.resetPasswordPage.typeItAgain')}
          type="password"
          value={draft.again}
          onValueChange={change('again')}
          autoComplete="new-password"
          descriptionPlacement="below"
          {...(errors.again === undefined ||
          !(hasTried || (draft.again !== '' && draft.again.length >= draft.password.length))
            ? {}
            : { error: errors.again })}
        />
      </form>
    </SetupStepFrame>
  );
};

AccountStep.displayName = 'AccountStep';

export { AccountStep };
