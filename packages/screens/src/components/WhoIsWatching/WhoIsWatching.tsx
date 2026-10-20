import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
} from '@keyline-icons/react';
import { Lock as LockIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PinField } from '@ValenceUI/PinField';
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
import { WayInMark } from '@ValenceScreens/components/WayInMark/WayInMark';
import type { WhoIsWatchingProps } from './WhoIsWatching.types';
import { say } from '@ValenceI18n/say';
import { isAPin } from '@ValenceContracts/functions/isAPin';

/**
 * Asks who is watching on this device, once somebody has signed in to an account more than one
 * person shares: the account's profiles, and then a profile's PIN where it has one. The owner of an
 * account that can do more than watch is asked to choose a PIN the first time others share it, and
 * anybody who forgot a PIN can choose a new one with the account's password. Whoever is holding the
 * device can sign the account out from here, without knowing anybody's PIN.
 *
 * @param name - What this server calls itself, shown as the mark above the faces.
 * @param account - What the account signed in here is called, said beneath the question so two
 *   screens asking it in a row are told apart.
 * @param profiles - The profiles on the account.
 * @param askingFor - A profile somebody already picked elsewhere, whose PIN is asked for first.
 * @param onChosen - Called with the profile once it is chosen.
 * @param onSignOut - Told to sign the account out of this device.
 */
const WhoIsWatching = ({
  name,
  account,
  profiles,
  askingFor,
  onChosen,
  onSignOut,
}: WhoIsWatchingProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const move = prefersReducedMotion === true ? stillTransition : liquidSpring;
  const [step, setStep] = useState<ChoosingStep>(() => {
    const picked = profiles.find((profile) => profile.id === askingFor);

    return picked?.hasPin === true ? { kind: 'pin', profile: picked } : { kind: 'faces' };
  });
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [round, setRound] = useState(0);

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
    isAPin(pin) && pinsMatch && (step.kind !== 'forgot' || password !== '') && !isAsking;

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
          <WayInMark name={name} isSmall />

          <motion.h1
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'heavy')}
            className="text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-[-0.04em] text-text"
          >
            {say('common.whoIsWatching')}
          </motion.h1>

          {account === undefined ? null : (
            <motion.p
              variants={revealVariants(prefersReducedMotion)}
              transition={revealTransition(prefersReducedMotion)}
              className="-mt-9 text-sm text-text-muted"
            >
              {say('screens.whoIsWatching.signedInAsAccount', { account })}
            </motion.p>
          )}

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
                  layoutId={`chosen-${round.toString()}-${profile.id}`}
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

          <motion.div
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
          >
            <Button variant="ghost" size="sm" disabled={isAsking} onClick={onSignOut}>
              <Icon of={LogOutIcon} size={16} />
              {say('common.signOut')}
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <div key="proof" className="flex w-full max-w-sm flex-col items-center gap-6">
          <motion.span layoutId={`chosen-${round.toString()}-${chosen.id}`} transition={move}>
            <ProfileFace profile={chosen} isLifted className="size-32 text-5xl sm:size-36" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-2xl font-semibold tracking-tight text-text"
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

            <PinField
              label={
                isSettingAPin
                  ? say('screens.whoIsWatching.newPin')
                  : say('screens.whoIsWatching.pin')
              }
              {...(isSettingAPin
                ? { description: say('screens.whoIsWatching.fourToEightDigits') }
                : {})}
              isNew={isSettingAPin}
              value={pin}
              onValueChange={setPin}
              className="items-center text-center"
              hasFocusOnMount={step.kind !== 'forgot'}
              {...(problem === null || isSettingAPin ? {} : { error: problem })}
            />

            {isSettingAPin ? (
              <PinField
                label={say('screens.whoIsWatching.typeThePinAgain')}
                isNew
                value={again}
                onValueChange={setAgain}
                className="items-center text-center"
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
              setRound((was) => was + 1);
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
