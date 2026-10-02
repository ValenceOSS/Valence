import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  Alert as AlertIcon,
  Bin as BinIcon,
  Lock as LockIcon,
  Plus as PlusIcon,
  Unlock as UnlockIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { say } from '@ValenceI18n/say';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import { readOrigin } from './readOrigin';
import type { AccessStepProps } from './AccessStep.types';

/**
 * How the server is reached: each address people open Valence on, offered from what this browser
 * reached it by and added or taken away one at a time, and whether it is served over HTTPS, which
 * decides whether its sign-in cookies are marked secure. Going on from here makes the administrator.
 *
 * @param detectedOrigin - The address this browser reached Valence on.
 * @param suggestedOrigins - The addresses worth offering.
 * @param origins - The addresses trusted so far.
 * @param onOriginsChange - Told as they change.
 * @param cookieSecure - Whether it is served over HTTPS.
 * @param onCookieSecureChange - Told as that changes.
 * @param isCreating - Whether the administrator is being made.
 * @param problem - Why making them failed, where it did.
 * @param onBack - Told to go back to the account.
 * @param onCreate - Told to make the administrator.
 */
const AccessStep = ({
  detectedOrigin,
  suggestedOrigins,
  origins,
  onOriginsChange,
  cookieSecure,
  onCookieSecureChange,
  isCreating,
  problem,
  onBack,
  onCreate,
}: AccessStepProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const explanationId = useId();
  const [typed, setTyped] = useState('');
  const [typedProblem, setTypedProblem] = useState<string | null>(null);
  const unused = suggestedOrigins.filter((origin) => !origins.includes(origin));
  const isPlainHere = detectedOrigin.startsWith('http://');

  const add = () => {
    const origin = readOrigin(typed);

    if (origin === null) {
      setTypedProblem(say('screens.setupWizard.validateSetupForm.eachOriginMustBeAFull'));

      return;
    }

    setTypedProblem(null);
    setTyped('');

    if (!origins.includes(origin)) {
      onOriginsChange([...origins, origin]);
    }
  };

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.accessStep.howValenceIsReached')}
      lead={say('screens.setupWizard.accessStep.valenceOnlyAcceptsSignInsFrom')}
      back={
        <Button variant="ghost" disabled={isCreating} onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <Button
          variant="confirm"
          size="lg"
          isLoading={isCreating}
          disabled={origins.length === 0}
          onClick={onCreate}
        >
          {say('screens.setupWizard.accessStep.createMyAccount')}
        </Button>
      }
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">
          {say('screens.setupWizard.trustedOrigins')}
        </h2>

        <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-hover)]">
          <AnimatePresence initial={false}>
            {origins.map((origin) => (
              <motion.li
                key={origin}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={revealTransition(prefersReducedMotion)}
                className="border-b border-[var(--surface-line)] last:border-b-0"
              >
                <div className="flex items-center gap-3 py-1.5 pl-4 pr-1.5">
                  <span className="min-w-0 flex-1 truncate text-sm tabular-nums text-text">
                    {origin}
                  </span>

                  {origin === detectedOrigin ? (
                    <Badge size="sm" tone="quiet">
                      {say('screens.setupWizard.accessStep.thisBrowser')}
                    </Badge>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="xs"
                    isIconOnly
                    label={say('screens.setupWizard.accessStep.stopTrustingOrigin', { origin })}
                    onClick={() => {
                      onOriginsChange(origins.filter((held) => held !== origin));
                    }}
                  >
                    <Icon of={BinIcon} size={16} />
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>

          {origins.length === 0 ? (
            <li className="px-4 py-3 text-sm text-text-muted">
              {say('screens.setupWizard.validateSetupForm.enterAtLeastOneOrigin')}
            </li>
          ) : null}
        </ul>

        {unused.length === 0 ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">
              {say('screens.setupWizard.accessStep.suggested')}
            </span>

            {unused.map((origin) => (
              <Button
                key={origin}
                variant="secondary"
                size="xs"
                isPill
                onClick={() => {
                  onOriginsChange([...origins, origin]);
                }}
              >
                <Icon of={PlusIcon} size={14} />
                {origin}
              </Button>
            ))}
          </div>
        )}

        <form
          noValidate
          className="flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <TextField
            label={say('screens.setupWizard.accessStep.addAnotherAddress')}
            isLabelHidden
            type="url"
            value={typed}
            onValueChange={(value) => {
              setTyped(value);
              setTypedProblem(null);
            }}
            placeholder={say('screens.setupWizard.accessStep.originExample')}
            className="min-w-0 flex-1"
            descriptionPlacement="below"
            {...(typedProblem === null ? {} : { error: typedProblem })}
          />

          <Button type="submit" variant="secondary" disabled={typed.trim() === ''}>
            <Icon of={PlusIcon} size={16} />
            {say('common.add')}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <Switch
          label={say('screens.setupWizard.thisServerIsReachedOverHTTPS')}
          isOn={cookieSecure}
          onToggle={() => {
            onCookieSecureChange(!cookieSecure);
          }}
          describedBy={explanationId}
        />

        <p
          id={explanationId}
          className="flex items-start gap-2 text-sm leading-relaxed text-text-muted"
        >
          <Icon of={cookieSecure ? LockIcon : UnlockIcon} size={16} className="mt-0.5 shrink-0" />
          {cookieSecure
            ? say('screens.setupWizard.secureCookiesWillBeUsedLogin')
            : say('screens.setupWizard.cookiesWillNotBeMarkedSecure')}
        </p>
      </section>

      {cookieSecure && isPlainHere ? (
        <Callout
          tone="warning"
          icon={AlertIcon}
          title={say('screens.setupWizard.accessStep.thisBrowserReachedItOverPlainHttp')}
        >
          {say('screens.setupWizard.accessStep.signingInHereStopsWorking')}
        </Callout>
      ) : null}

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}
    </SetupStepFrame>
  );
};

AccessStep.displayName = 'AccessStep';

export { AccessStep };
