import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { giveFirstPassword } from '@ValenceClient/setup/giveFirstPassword';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { PasskeyOffer } from '@ValenceScreens/components/PasskeyOffer/PasskeyOffer';
import { useSignInStanding } from '@ValenceScreens/passkeys/useSignInStanding';
import type { PasskeyStepProps } from './PasskeyStep.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * The last step of setting a household up. A passkey is offered as something to take or leave to an
 * account that signs in with a password, and shown as done to one that made a passkey when it was
 * set up. An account with neither, which set up with a passkey that did not take, cannot finish
 * until it has a passkey or a password, since otherwise this browser is its only way back in.
 *
 * @param isFinishing - Whether finishing is under way.
 * @param onFinish - Called to finish setting up.
 */
const PasskeyStep = ({ isFinishing, onFinish }: PasskeyStepProps) => {
  const cache = useQueryClient();
  const standing = useSignInStanding();
  const [isChoosingAPassword, setIsChoosingAPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isKeeping, setIsKeeping] = useState(false);

  const readAgain = async (): Promise<void> => {
    await cache.invalidateQueries({ queryKey: sessionQueries.passkeys().queryKey });
    await cache.invalidateQueries({ queryKey: sessionQueries.password().queryKey });
  };

  const keepThePassword = async (): Promise<void> => {
    setIsKeeping(true);
    setProblem(null);

    const refused = await giveFirstPassword(password);

    setIsKeeping(false);

    if (refused !== null) {
      setProblem(refused.message);

      return;
    }

    notify.say(say('screens.firstPassword.passwordSet'));
    await readAgain();
  };

  return (
    <div className="flex flex-col gap-5">
      {standing === 'hasPasskey' ? (
        <p className="text-center text-sm text-text">
          {say('screens.householdOnboarding.thatIsSetYouCanSign')}
        </p>
      ) : isChoosingAPassword && standing === 'needsAWayIn' ? (
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void keepThePassword();
          }}
        >
          <TextField
            label={say('common.password')}
            type="password"
            autoComplete="new-password"
            value={password}
            onValueChange={setPassword}
            description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
            hasFocusOnMount
            {...(problem === null ? {} : { error: problem })}
          />

          <Button
            type="submit"
            variant="secondary"
            isLoading={isKeeping}
            disabled={password.length < MINIMUM_PASSWORD_LENGTH}
          >
            {say('screens.adminArea.accountsPanel.setAPassword')}
          </Button>
        </form>
      ) : (
        <PasskeyOffer
          onMade={() => {
            void readAgain();
          }}
        />
      )}

      {standing !== 'needsAWayIn' ? null : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsChoosingAPassword((current) => !current);
          }}
        >
          {isChoosingAPassword
            ? say('common.useAPasskeyInstead')
            : say('screens.welcomePage.useAPasswordInstead')}
        </Button>
      )}

      <Button
        variant="glossy"
        size="lg"
        className="w-full"
        isLoading={isFinishing}
        disabled={standing === 'needsAWayIn' || standing === 'reading'}
        onClick={onFinish}
      >
        {say('screens.householdOnboarding.finish')}
      </Button>
    </div>
  );
};

PasskeyStep.displayName = 'PasskeyStep';

export { PasskeyStep };
