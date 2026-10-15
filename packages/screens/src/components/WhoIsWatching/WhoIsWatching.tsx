import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { Lock as LockIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import {
  liquidSpring,
  revealTransition,
  revealVariants,
  staggerVariants,
  stillTransition,
} from '@ValenceUI/animations/reveal';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import type { ProfileChoice } from '@ValenceClient/profiles/chooseProfile';
import { lightsOfAColour } from '@ValenceScreens/library/lightsOfAColour';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { WayInBackground } from '@ValenceScreens/components/WayInBackground/WayInBackground';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ChoosingStep } from '@ValenceClient/profiles/ChoosingStep';
import type { WhoIsWatchingProps } from './WhoIsWatching.types';
import { say } from '@ValenceI18n/say';

const PIN = /^\d{4,8}$/u;

/**
 * Asks who is watching on this device, once somebody has signed in to an account more than one
 * person shares: the account's profiles, and then a profile's PIN where it has one. The owner of an
 * account that can do more than watch is asked to choose a PIN the first time others share it, and
 * anybody who forgot a PIN can choose a new one with the account's password.
 *
 * @param profiles - The profiles on the account.
 * @param onChosen - Called with the profile once it is chosen.
 */
const WhoIsWatching = ({ profiles, onChosen }: WhoIsWatchingProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const move = prefersReducedMotion === true ? stillTransition : liquidSpring;
  const [step, setStep] = useState<ChoosingStep>({ kind: 'faces' });
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const clear = () => {
    setPin('');
    setAgain('');
    setPassword('');
    setProblem(null);
  };

  const settle = (profile: ViewerProfile, choice: ProfileChoice) => {
    setIsAsking(false);

    switch (choice.kind) {
      case 'chosen':
        onChosen(choice.profile);
        break;
      case 'needsPin':
        setStep({ kind: 'pin', profile });
        setPin('');
        setProblem(choice.reason);
        break;
      case 'needsNewPin':
        clear();
        setStep({ kind: 'newPin', profile, why: choice.reason });
        break;
      case 'waiting':
      case 'refused':
        setPin('');
        setProblem(choice.reason);
        break;
    }
  };

  const ask = async (profile: ViewerProfile, proof: Parameters<typeof chooseProfile>[1]) => {
    setIsAsking(true);
    setProblem(null);
    settle(profile, await chooseProfile(profile.id, proof));
  };

  const pick = (profile: ViewerProfile) => {
    clear();

    if (profile.hasPin) {
      setStep({ kind: 'pin', profile });

      return;
    }

    void ask(profile, {});
  };

  const chosen = step.kind === 'faces' ? null : step.profile;
  const isSettingAPin = step.kind === 'newPin' || step.kind === 'forgot';
  const pinsMatch = !isSettingAPin || pin === again;
  const canSend =
    PIN.test(pin) && pinsMatch && (step.kind !== 'forgot' || password !== '') && !isAsking;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-y-auto px-6 pb-28 pt-16">
      <WayInBackground lights={chosen === null ? [] : lightsOfAColour(chosen.colour)} />

      {chosen === null ? (
        <motion.div
          key="faces"
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="flex w-full flex-col items-center gap-12"
        >
          <motion.h1
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'heavy')}
            className="text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-headline md:tracking-display text-text"
          >
            {say('common.whoIsWatching')}
          </motion.h1>

          <motion.ul
            variants={staggerVariants}
            className="flex w-full max-w-4xl flex-wrap items-start justify-center gap-6 sm:gap-10"
          >
            {profiles.map((profile) => (
              <motion.li
                key={profile.id}
                variants={revealVariants(prefersReducedMotion)}
                transition={revealTransition(prefersReducedMotion)}
              >
                <motion.button
                  type="button"
                  layoutId={`chosen-${profile.id}`}
                  transition={move}
                  disabled={isAsking}
                  onClick={() => {
                    pick(profile);
                  }}
                  {...(prefersReducedMotion === true
                    ? {}
                    : { whileHover: { y: -8 }, whileTap: { scale: 0.97 } })}
                  className="flex w-24 flex-col items-center gap-3 sm:w-32"
                >
                  <span className="relative w-full">
                    <ProfileFace
                      profile={profile}
                      isLifted
                      className="aspect-square w-full text-4xl sm:text-5xl"
                    />

                    {profile.hasPin ? (
                      <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-surface-raised text-text-muted shadow">
                        <Icon
                          of={LockIcon}
                          size={14}
                          label={say('screens.whoIsWatching.hasAPin')}
                        />
                      </span>
                    ) : null}
                  </span>

                  <span className="w-full truncate text-center text-sm text-text-muted">
                    {profile.name}
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>

          {problem === null ? null : (
            <p role="alert" className="max-w-sm text-center text-sm text-danger">
              {problem}
            </p>
          )}
        </motion.div>
      ) : (
        <div key="proof" className="flex w-full max-w-sm flex-col items-center gap-6">
          <motion.span layoutId={`chosen-${chosen.id}`} transition={move}>
            <ProfileFace profile={chosen} isLifted className="size-32 text-5xl sm:size-36" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-2xl font-semibold tracking-title text-text"
          >
            {step.kind === 'newPin' ? say('screens.whoIsWatching.choosePin') : chosen.name}
          </motion.h1>

          {step.kind === 'newPin' ? (
            <p className="text-center text-sm text-text-muted">{step.why}</p>
          ) : step.kind === 'forgot' ? (
            <p className="text-center text-sm text-text-muted">
              {say('screens.whoIsWatching.enterThePasswordToChoose', { name: chosen.name })}
            </p>
          ) : null}

          <motion.form
            key={step.kind}
            noValidate
            initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (!canSend) {
                return;
              }

              void ask(
                chosen,
                step.kind === 'pin'
                  ? { pin }
                  : step.kind === 'forgot'
                    ? { password, newPin: pin }
                    : { newPin: pin },
              );
            }}
          >
            {step.kind === 'forgot' ? (
              <TextField
                label={say('common.password')}
                type="password"
                size="lg"
                value={password}
                onValueChange={setPassword}
                autoComplete="current-password"
                hasFocusOnMount
              />
            ) : null}

            <TextField
              label={
                isSettingAPin
                  ? say('screens.whoIsWatching.newPin')
                  : say('screens.whoIsWatching.pin')
              }
              {...(isSettingAPin
                ? { description: say('screens.whoIsWatching.fourToEightDigits') }
                : {})}
              type="password"
              size="lg"
              inputMode="numeric"
              autoComplete={isSettingAPin ? 'new-password' : 'off'}
              value={pin}
              onValueChange={(typed) => {
                setPin(typed.replace(/\D/gu, '').slice(0, 8));
              }}
              hasFocusOnMount={step.kind !== 'forgot'}
              {...(problem === null || isSettingAPin ? {} : { error: problem })}
            />

            {isSettingAPin ? (
              <TextField
                label={say('screens.whoIsWatching.typeThePinAgain')}
                type="password"
                size="lg"
                inputMode="numeric"
                autoComplete="new-password"
                value={again}
                onValueChange={(typed) => {
                  setAgain(typed.replace(/\D/gu, '').slice(0, 8));
                }}
                {...(again !== '' && !pinsMatch
                  ? { error: say('screens.whoIsWatching.thosePinsDoNotMatch') }
                  : problem === null
                    ? {}
                    : { error: problem })}
              />
            ) : null}

            <Button
              type="submit"
              variant="confirm"
              size="lg"
              isLoading={isAsking}
              disabled={!canSend}
            >
              {say('common.continue')}
              <Icon of={ChevronRightIcon} size={18} />
            </Button>
          </motion.form>

          {step.kind === 'pin' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                setStep({ kind: 'forgot', profile: chosen });
              }}
            >
              {say('screens.whoIsWatching.forgotThePin')}
            </Button>
          ) : null}

          <Button
            isIconOnly
            variant="ghost"
            label={say('common.somebodyElse')}
            onClick={() => {
              clear();
              setStep({ kind: 'faces' });
            }}
          >
            <Icon of={ChevronLeftIcon} size={18} />
          </Button>
        </div>
      )}
    </main>
  );
};

WhoIsWatching.displayName = 'WhoIsWatching';

export { WhoIsWatching };
