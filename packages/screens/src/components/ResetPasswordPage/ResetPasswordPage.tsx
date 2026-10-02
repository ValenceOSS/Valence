import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@ValenceUI/Button';
import { Link } from '@ValenceUI/Link';
import { TextField } from '@ValenceUI/TextField';
import { resetPassword } from '@ValenceClient/session/resetPassword';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { ForgotPassword } from '@ValenceScreens/components/ForgotPassword/ForgotPassword';
import type { ResetPasswordPageProps } from './ResetPasswordPage.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Where a password reset link lands: takes a new password, twice, and sets it with the link's token.
 * A link that has expired or was used already says so and offers to send another.
 *
 * @param name - What this instance is called.
 */
const ResetPasswordPage = ({ name }: ResetPasswordPageProps) => {
  const search = useSearch({ strict: false });
  const token =
    search.error === undefined && search.token !== undefined && search.token !== ''
      ? search.token
      : null;
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isChanged, setIsChanged] = useState(false);

  const isLongEnough = password.length >= MINIMUM_PASSWORD_LENGTH;
  const isMatched = password === again;

  const submit = async () => {
    if (token === null) {
      return;
    }

    setIsSaving(true);
    setProblem(null);

    const outcome = await resetPassword(token, password);

    setIsSaving(false);

    if (outcome.kind === 'changed') {
      setIsChanged(true);

      return;
    }

    setProblem(outcome.reason);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-12">
      <p className="text-2xl font-semibold tracking-[-0.04em] text-text">{name}</p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-[-0.04em] text-text">
          {say('screens.forgotPassword.resetYourPassword')}
        </h1>

        {isChanged ? (
          <>
            <p role="status" className="text-sm leading-relaxed text-text-muted">
              {say('screens.resetPasswordPage.yourPasswordIsChanged')}
            </p>

            <Link href="/">{say('screens.profileGate.signIn')}</Link>
          </>
        ) : token === null ? (
          <>
            <p role="alert" className="text-sm leading-relaxed text-text-muted">
              {say('client.session.resetPassword.thatLinkHasExpired')}
            </p>

            <ForgotPassword />
          </>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <TextField
              label={say('screens.adminArea.accountsPanel.newPassword')}
              type="password"
              size="lg"
              autoComplete="new-password"
              hasFocusOnMount
              description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
              value={password}
              onValueChange={setPassword}
            />

            <TextField
              label={say('screens.resetPasswordPage.typeItAgain')}
              type="password"
              size="lg"
              autoComplete="new-password"
              value={again}
              onValueChange={setAgain}
              {...(again !== '' && !isMatched
                ? { error: say('screens.resetPasswordPage.theTwoPasswordsAreNotThe') }
                : problem === null
                  ? {}
                  : { error: problem })}
            />

            <Button
              type="submit"
              variant="confirm"
              size="lg"
              isLoading={isSaving}
              disabled={!isLongEnough || !isMatched}
            >
              {say('screens.resetPasswordPage.setThePassword')}
            </Button>

            {problem === null ? null : <ForgotPassword />}
          </form>
        )}
      </div>
    </main>
  );
};

ResetPasswordPage.displayName = 'ResetPasswordPage';

export { ResetPasswordPage };
