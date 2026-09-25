import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { QrCode } from '@ValenceUI/QrCode';
import { TextField } from '@ValenceUI/TextField';
import { disableTwoFactor, enableTwoFactor, verifyTotp } from '@ValenceClient/session/auth';
import { readTotpSecret, formatTotpSecret } from './readTotpSecret';
import type { Enrollment, SetupStage, TwoFactorSetupProps } from './TwoFactorSetup.types';
import { say } from '@ValenceI18n/say';

/**
 * Turns two-factor on and off for an account. Enrolling asks for the password again, shows the secret
 * as both a code to scan and characters to type, and hands over the backup codes once — anyone who
 * loses both their authenticator and those codes loses the account.
 *
 * @param isEnabled - Whether two-factor is on at the moment.
 * @param onChanged - Called after it is turned on or off.
 */
const TwoFactorSetup = ({ isEnabled, onChanged }: TwoFactorSetupProps) => {
  const [stage, setStage] = useState<SetupStage>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const reset = () => {
    setStage('idle');
    setPassword('');
    setCode('');
    setEnrollment(null);
    setError(null);
  };

  const begin = async () => {
    if (password.length === 0) {
      setError(say('screens.twoFactorSetup.enterPassword'));

      return;
    }

    setError(null);
    setIsBusy(true);

    try {
      const started = await enableTwoFactor(password);

      if (started === null) {
        setError(say('screens.twoFactorSetup.wrongPassword'));

        return;
      }

      setEnrollment({
        totpURI: started.totpURI,
        secret: readTotpSecret(started.totpURI),
        backupCodes: started.backupCodes,
      });
      setPassword('');
      setStage('showSecret');
    } catch {
      setError(say('screens.twoFactorSetup.couldNotReach'));
    } finally {
      setIsBusy(false);
    }
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(say('screens.twoFactorSetup.codeLength'));

      return;
    }

    setError(null);
    setIsBusy(true);

    try {
      if (!(await verifyTotp(code.trim()))) {
        setError(say('screens.twoFactorSetup.invalidCode'));

        return;
      }

      reset();
      onChanged();
    } catch {
      setError(say('screens.twoFactorSetup.couldNotReach'));
    } finally {
      setIsBusy(false);
    }
  };

  const disable = async () => {
    if (password.length === 0) {
      setError(say('screens.twoFactorSetup.enterPassword'));

      return;
    }

    setError(null);
    setIsBusy(true);

    try {
      if (!(await disableTwoFactor(password))) {
        setError(say('screens.twoFactorSetup.wrongPassword'));

        return;
      }

      reset();
      onChanged();
    } catch {
      setError(say('screens.twoFactorSetup.couldNotReach'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col">
      <SettingRow
        title={say('screens.twoFactorSetup.title')}
        description={
          isEnabled
            ? say('screens.twoFactorSetup.onDescription')
            : say('screens.twoFactorSetup.offDescription')
        }
      >
        {stage !== 'idle' ? null : isEnabled ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStage('disable');
            }}
          >
            {say('screens.twoFactorSetup.turnOff')}
          </Button>
        ) : (
          <Button
            variant="glossy"
            size="sm"
            onClick={() => {
              setStage('confirmPassword');
            }}
          >
            {say('screens.twoFactorSetup.setUp')}
          </Button>
        )}
      </SettingRow>

      <div className="flex flex-col gap-4 empty:hidden [&:not(:empty)]:px-5 [&:not(:empty)]:pb-5">
        {error === null ? null : (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        {stage === 'confirmPassword' || stage === 'disable' ? (
          <form
            noValidate
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void (stage === 'disable' ? disable() : begin());
            }}
          >
            <TextField
              label={say('screens.twoFactorSetup.password')}
              type="password"
              value={password}
              onValueChange={setPassword}
              autoComplete="current-password"
              description={say('screens.twoFactorSetup.passwordHint')}
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={isBusy}>
                {say('screens.twoFactorSetup.continue')}
              </Button>
              <Button type="button" variant="ghost" onClick={reset}>
                {say('common.cancel')}
              </Button>
            </div>
          </form>
        ) : null}

        {stage === 'showSecret' && enrollment !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">{say('screens.twoFactorSetup.scanThis')}</p>

            <QrCode value={enrollment.totpURI} label={say('screens.twoFactorSetup.qrLabel')} />

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text">
                {say('screens.twoFactorSetup.setupKey')}
              </span>
              <code className="rounded-md bg-surface-raised px-3 py-2 font-mono text-sm text-text">
                {formatTotpSecret(enrollment.secret)}
              </code>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text">
                {say('screens.twoFactorSetup.backupCodes')}
              </span>
              <p className="text-sm text-text-muted">{say('screens.twoFactorSetup.saveThese')}</p>
              <ul className="grid grid-cols-2 gap-1 rounded-md bg-surface-raised p-3 font-mono text-sm text-text">
                {enrollment.backupCodes.map((backupCode) => (
                  <li key={backupCode}>{backupCode}</li>
                ))}
              </ul>
            </div>

            <form
              noValidate
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <TextField
                label={say('screens.twoFactorSetup.codeLabel')}
                value={code}
                onValueChange={setCode}
                autoComplete="one-time-code"
                placeholder="123456"
                description={say('screens.twoFactorSetup.codeHint')}
              />

              <div className="flex gap-2">
                <Button type="submit" isLoading={isBusy}>
                  {say('screens.twoFactorSetup.turnOn')}
                </Button>
                <Button type="button" variant="ghost" onClick={reset}>
                  {say('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};

TwoFactorSetup.displayName = 'TwoFactorSetup';

export { TwoFactorSetup };
