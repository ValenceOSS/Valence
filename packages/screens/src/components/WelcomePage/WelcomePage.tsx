import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Key as KeyIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { readSetupLink } from '@ValenceClient/setup/readSetupLink';
import { redeemSetupLink } from '@ValenceClient/setup/redeemSetupLink';
import { giveFirstPassword } from '@ValenceClient/setup/giveFirstPassword';
import { registerPasskey } from '@ValenceClient/session/auth';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import { UsernameSchema } from '@ValenceContracts/schemas/SetupLink';
import { isPasskeySupported } from '@ValenceScreens/passkeys/isPasskeySupported';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { WelcomePageProps } from './WelcomePage.types';
import { EMAIL_PATTERN } from '@ValenceContracts/constants/EMAIL_PATTERN';

type Finish = 'choosing' | 'passkeyFailed' | 'needsSignIn';

/**
 * Where a setup link lands, for somebody signed out: welcomes them by name and asks for what their
 * administrator left for them to choose — their username the first time, an email address if the
 * account has none, and a password or a passkey — then signs them in and takes them into Valence. A
 * link already used, revoked or run out says so and to ask for another.
 *
 * Used on an account already in use, the same page is a friendlier password reset: the username is
 * kept, and a new password or passkey is chosen.
 *
 * @param name - What this instance is called.
 */
const WelcomePage = ({ name }: WelcomePageProps) => {
  const { token = '' } = useParams({ strict: false });
  const cache = useQueryClient();
  const navigate = useNavigate();
  const asked = useQuery({
    queryKey: ['setup-link', token],
    queryFn: () => readSetupLink(token),
    retry: false,
    staleTime: Infinity,
  });
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isUsingPasskey, setIsUsingPasskey] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [finish, setFinish] = useState<Finish>('choosing');

  const details = asked.data ?? null;
  const mayRename = details !== null && !details.hasPassword;
  const chosenUsername = (username ?? details?.suggestedUsername ?? '').trim();
  const chosenEmail = email.trim();
  const canPasskey = isPasskeySupported();

  /**
   * Takes them into Valence, signed in.
   */
  const goIn = async () => {
    await cache.invalidateQueries({ queryKey: ['session'] });
    await navigate({ to: '/' });
  };

  /**
   * Makes a passkey for the account just set up, and goes in once it is made.
   */
  const makePasskey = async () => {
    setIsFinishing(true);
    setProblem(null);

    const made = await registerPasskey(say('common.thisDevice'));

    setIsFinishing(false);

    if (made.kind === 'registered') {
      await goIn();

      return;
    }

    setFinish('passkeyFailed');
    setProblem(made.kind === 'failed' ? made.reason : null);
  };

  const submit = async () => {
    if (details === null || isFinishing) {
      return;
    }

    setIsFinishing(true);
    setProblem(null);

    const redeemed = await redeemSetupLink(token, {
      ...(mayRename && chosenUsername !== '' ? { username: chosenUsername } : {}),
      ...(!details.hasEmail && chosenEmail !== '' ? { email: chosenEmail } : {}),
      ...(isUsingPasskey ? {} : { password }),
    });

    setIsFinishing(false);

    if (redeemed.kind === 'refused') {
      setProblem(redeemed.refusal?.message ?? null);

      return;
    }

    if (!redeemed.value.isSignedIn) {
      setFinish('needsSignIn');

      return;
    }

    if (isUsingPasskey) {
      await makePasskey();

      return;
    }

    await goIn();
  };

  const setPasswordInstead = async () => {
    setIsFinishing(true);
    setProblem(null);

    const refusal = await giveFirstPassword(password);

    setIsFinishing(false);

    if (refusal !== null) {
      setProblem(refusal.message);

      return;
    }

    await goIn();
  };

  const isReady =
    details !== null &&
    (!mayRename || UsernameSchema.safeParse(chosenUsername).success) &&
    (chosenEmail === '' || EMAIL_PATTERN.test(chosenEmail)) &&
    (isUsingPasskey || password.length >= MINIMUM_PASSWORD_LENGTH);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-12">
      <p className="text-2xl font-semibold tracking-[-0.04em] text-text">{name}</p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {asked.isPending ? (
          <Spinner label={say('screens.welcomePage.readingYourLink')} />
        ) : details === null ? (
          <>
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-[-0.04em] text-text">
              {say('server.email.composeLinkEmail.setUpYourAccount')}
            </h1>

            <p role="alert" className="text-sm leading-relaxed text-text-muted">
              {say('error.setupLink.thatLinkNoLongerWorks')}
            </p>

            <Link href="/">{say('screens.profileGate.signIn')}</Link>
          </>
        ) : finish === 'needsSignIn' ? (
          <>
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-[-0.04em] text-text">
              {say('server.email.composeLinkEmail.welcomeName', { name: details.name })}
            </h1>

            <p role="status" className="text-sm leading-relaxed text-text-muted">
              {say('screens.welcomePage.yourPasswordIsSetSignInWithIt')}
            </p>

            <Link href="/">{say('screens.profileGate.signIn')}</Link>
          </>
        ) : finish === 'passkeyFailed' ? (
          <>
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-[-0.04em] text-text">
              {say('screens.welcomePage.yourPasskeyWasNotMade')}
            </h1>

            <p className="text-sm leading-relaxed text-text-muted">
              {say('screens.welcomePage.yourAccountIsSetUpTryThePasskeyAgain')}
            </p>

            <Button
              variant="confirm"
              size="lg"
              isLoading={isFinishing}
              onClick={() => {
                void makePasskey();
              }}
            >
              <Icon of={KeyIcon} size={18} />
              {say('screens.welcomePage.tryThePasskeyAgain')}
            </Button>

            <TextField
              label={say('common.password')}
              type="password"
              size="lg"
              autoComplete="new-password"
              description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
              value={password}
              onValueChange={setPassword}
              {...(problem === null ? {} : { error: problem })}
            />

            <Button
              variant="secondary"
              size="lg"
              disabled={password.length < MINIMUM_PASSWORD_LENGTH || isFinishing}
              onClick={() => {
                void setPasswordInstead();
              }}
            >
              {say('screens.welcomePage.useThisPasswordInstead')}
            </Button>
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
            <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-semibold tracking-[-0.04em] text-text">
              {say('server.email.composeLinkEmail.welcomeName', { name: details.name })}
            </h1>

            <p className="text-sm leading-relaxed text-text-muted">
              {details.hasPassword
                ? say('screens.welcomePage.chooseANewPasswordOrAPasskey')
                : say('screens.welcomePage.chooseHowYouSignIn', { server: name })}
            </p>

            {mayRename ? (
              <TextField
                label={say('common.username')}
                size="lg"
                autoComplete="username"
                value={username ?? details.suggestedUsername}
                onValueChange={setUsername}
                description={say('screens.welcomePage.youSignInWithThisOrYourEmail')}
              />
            ) : (
              <p className="text-sm text-text">
                {say('screens.welcomePage.yourUsernameIsUsername', {
                  username: details.username ?? '',
                })}
              </p>
            )}

            {details.hasEmail ? null : (
              <TextField
                label={say('screens.addAccountDialog.emailOptional')}
                type="email"
                size="lg"
                autoComplete="email"
                value={email}
                onValueChange={setEmail}
                description={say('screens.welcomePage.anAddressLetsYouResetYourPassword')}
              />
            )}

            {isUsingPasskey ? (
              <p className="text-sm leading-relaxed text-text-muted">
                {say('screens.welcomePage.yourDeviceWillAskToMakeAPasskey')}
              </p>
            ) : (
              <TextField
                label={say('common.password')}
                type="password"
                size="lg"
                autoComplete="new-password"
                description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
                value={password}
                onValueChange={setPassword}
              />
            )}

            {problem === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {problem}
              </p>
            )}

            <Button
              type="submit"
              variant="confirm"
              size="lg"
              isLoading={isFinishing}
              disabled={!isReady}
            >
              {say('screens.householdOnboarding.finish')}
            </Button>

            {!canPasskey ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsUsingPasskey((current) => !current);
                }}
              >
                <Icon of={KeyIcon} size={16} />
                {isUsingPasskey
                  ? say('screens.welcomePage.useAPasswordInstead')
                  : say('common.useAPasskeyInstead')}
              </Button>
            )}
          </form>
        )}
      </div>
    </main>
  );
};

WelcomePage.displayName = 'WelcomePage';

export { WelcomePage };
