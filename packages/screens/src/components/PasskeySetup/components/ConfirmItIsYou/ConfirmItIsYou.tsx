import { useState } from 'react';
import { Lock as LockIcon } from '@keyline-icons/react';
import { ScopedField } from '@ValenceUI/ScopedField';
import { confirmItIsYou } from '@ValenceClient/session/auth';
import type { ConfirmItIsYouProps } from './ConfirmItIsYou.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks somebody signed in a while ago for their password before they add a passkey, since the server
 * only lets a session signed in lately do that.
 *
 * @param onConfirmed - Told once the password is right.
 */
const ConfirmItIsYou = ({ onConfirmed }: ConfirmItIsYouProps) => {
  const [password, setPassword] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const confirm = async () => {
    setIsConfirming(true);
    setProblem(null);

    const outcome = await confirmItIsYou(password);

    setIsConfirming(false);

    if (outcome.kind === 'failed') {
      setProblem(outcome.reason);

      return;
    }

    setPassword('');
    onConfirmed();
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void confirm();
      }}
    >
      <ScopedField
        label={say('common.password')}
        type="password"
        value={password}
        onValueChange={setPassword}
        autoComplete="current-password"
        description={say('screens.passkeySetup.confirmItIsYou.youSignedInAWhileAgo')}
        submit={{
          label: say('common.confirm'),
          icon: LockIcon,
          isDisabled: password === '',
          isBusy: isConfirming,
        }}
      />

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
    </form>
  );
};

ConfirmItIsYou.displayName = 'ConfirmItIsYou';

export { ConfirmItIsYou };
