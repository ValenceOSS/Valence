import { Icon } from '@ValenceUI/Icon';
import { Lock as LockIcon, Unlock as UnlockIcon } from '@keyline-icons/react';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { TextField } from '@ValenceUI/TextField';
import { validateSetupForm, parseOrigins } from './validateSetupForm';
import type { SetupFormErrors, SetupWizardProps } from './SetupWizard.types';
import { say } from '@ValenceI18n/say';

/**
 * Walks whoever opened Valence first through making it theirs: the administrator account, what the
 * server is called, and which origins may reach it. Shown in place of everything else until it is
 * done, because a server with no account on it has nothing else worth showing.
 *
 * @param status - What setup has established so far.
 * @param onComplete - Called once the server is set up and ready to be signed in to.
 */
const SetupWizard = ({ status, onComplete }: SetupWizardProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trustedOrigins, setTrustedOrigins] = useState(status.suggestedTrustedOrigins.join(', '));
  const [cookieSecure, setCookieSecure] = useState(status.isSecureContext);
  const [errors, setErrors] = useState<SetupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const found = validateSetupForm({ name, email, password, trustedOrigins });

    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          admin: { name, email, password },
          trustedOrigins: parseOrigins(trustedOrigins),
          cookieSecure,
        }),
      });

      if (!response.ok) {
        setErrors({
          submit:
            response.status === 409
              ? say('screens.setupWizard.alreadySetUp')
              : say('screens.setupWizard.couldNotComplete'),
        });

        return;
      }

      onComplete();
    } catch {
      setErrors({ submit: say('screens.setupWizard.couldNotReach') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text">{say('screens.setupWizard.heading')}</h1>
        <p className="text-text-muted">{say('screens.setupWizard.lede')}</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-text">
          {say('screens.setupWizard.administrator')}
        </h2>

        <TextField
          label={say('screens.setupWizard.name')}
          value={name}
          onValueChange={setName}
          autoComplete="name"
          {...(errors.name === undefined ? {} : { error: errors.name })}
        />

        <TextField
          label={say('screens.setupWizard.email')}
          type="email"
          value={email}
          onValueChange={setEmail}
          autoComplete="email"
          {...(errors.email === undefined ? {} : { error: errors.email })}
        />

        <TextField
          label={say('screens.setupWizard.password')}
          type="password"
          value={password}
          onValueChange={setPassword}
          autoComplete="new-password"
          description={say('screens.setupWizard.passwordHint')}
          {...(errors.password === undefined ? {} : { error: errors.password })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-text">{say('screens.setupWizard.access')}</h2>

        <TextField
          label={say('screens.setupWizard.trustedOrigins')}
          value={trustedOrigins}
          onValueChange={setTrustedOrigins}
          description={say('screens.setupWizard.trustedOriginsHint', {
            origin: status.detectedOrigin,
          })}
          {...(errors.trustedOrigins === undefined ? {} : { error: errors.trustedOrigins })}
        />

        <Checkbox
          label={say('screens.setupWizard.https')}
          checked={cookieSecure}
          onCheckedChange={setCookieSecure}
        />

        <p className="flex items-start gap-2 text-sm text-text-muted">
          {cookieSecure ? (
            <Icon of={LockIcon} size={16} className="mt-0.5 shrink-0" />
          ) : (
            <Icon of={UnlockIcon} size={16} className="mt-0.5 shrink-0" />
          )}
          {cookieSecure
            ? say('screens.setupWizard.secureCookies')
            : say('screens.setupWizard.plainCookies')}
        </p>
      </section>

      {errors.submit === undefined ? null : (
        <p role="alert" className="text-sm text-danger">
          {errors.submit}
        </p>
      )}

      <Button
        isLoading={isSubmitting}
        onClick={() => {
          void submit();
        }}
      >
        {say('screens.setupWizard.finish')}
      </Button>
    </main>
  );
};

SetupWizard.displayName = 'SetupWizard';

export { SetupWizard };
