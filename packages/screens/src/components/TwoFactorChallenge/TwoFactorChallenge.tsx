import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { verifyBackupCode, verifyTotp } from '@ValenceClient/session/auth';
import type { ChallengeMode, TwoFactorChallengeProps } from './TwoFactorChallenge.types';
import { say } from '@ValenceI18n/say';

const TOTP_LENGTH = 6;

/**
 * Asks for the second step of signing in to an account with two-factor turned on: either the code
 * from an authenticator, or one of the backup codes for anybody who has lost the device holding it.
 *
 * @param onVerified - Called once the second step is accepted.
 */
const TwoFactorChallenge = ({ onVerified }: TwoFactorChallengeProps) => {
  const [mode, setMode] = useState<ChallengeMode>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTotp = mode === 'totp';

  const submit = async () => {
    const trimmed = code.trim();

    if (trimmed.length === 0) {
      setError(
        isTotp
          ? say('screens.twoFactorChallenge.enterCode')
          : say('screens.twoFactorChallenge.enterBackupCode'),
      );

      return;
    }

    if (isTotp && !/^\d{6}$/.test(trimmed)) {
      setError(say('screens.twoFactorChallenge.codeLength', { count: TOTP_LENGTH }));

      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const accepted = isTotp ? await verifyTotp(trimmed) : await verifyBackupCode(trimmed);

      if (!accepted) {
        setError(
          isTotp
            ? say('screens.twoFactorChallenge.invalidCode')
            : say('screens.twoFactorChallenge.invalidBackupCode'),
        );

        return;
      }

      onVerified();
    } catch {
      setError(say('screens.twoFactorChallenge.couldNotReach'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-center text-sm text-text-muted">
        {isTotp
          ? say('screens.twoFactorChallenge.lede')
          : say('screens.twoFactorChallenge.backupLede')}
      </p>

      <TextField
        label={
          isTotp
            ? say('screens.twoFactorChallenge.codeLabel')
            : say('screens.twoFactorChallenge.backupCodeLabel')
        }
        value={code}
        onValueChange={setCode}
        autoComplete="one-time-code"
        placeholder={isTotp ? '123456' : ''}
        size="lg"

        {...(error === null ? {} : { error })}
      />

      <Button type="submit" variant="glossy" size="lg" isLoading={isSubmitting}>
        {say('screens.twoFactorChallenge.verify')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setMode(isTotp ? 'backup' : 'totp');
          setCode('');
          setError(null);
        }}
      >
        {isTotp
          ? say('screens.twoFactorChallenge.useBackup')
          : say('screens.twoFactorChallenge.useApp')}
      </Button>
    </form>
  );
};

TwoFactorChallenge.displayName = 'TwoFactorChallenge';

export { TwoFactorChallenge };
