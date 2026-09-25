import { say } from '@ValenceI18n/say';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { GlassPanel } from '@ValenceUI/GlassPanel';
import { Icon } from '@ValenceUI/Icon';
import { Image as ImageIcon, Key as KeyIcon } from '@keyline-icons/react';
import { Logo } from '@ValenceUI/Logo';
import { PageDots } from '@ValenceUI/PageDots';
import { TabPanel } from '@ValenceUI/TabPanel';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { registerPasskey } from '@ValenceClient/session/auth';
import {
  finishOnboarding,
  saveHousehold,
  uploadHouseholdPhoto,
} from '@ValenceClient/household/fetchHousehold';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import { WayInBackground } from '@ValenceScreens/components/WayInBackground/WayInBackground';
import { WelcomeToValence } from '@ValenceScreens/components/WelcomeToValence/WelcomeToValence';
import { describePasskeyUnavailability } from '@ValenceScreens/passkeys/isPasskeySupported';
import { whatIsWrongWithTheName } from './whatIsWrongWithTheName';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { HouseholdOnboardingProps } from './HouseholdOnboarding.types';

const STEPS = ['name', 'picture', 'passkey'] as const;

const LABELS: readonly StringKey[] = [
  'screens.householdOnboarding.nameStep',
  'screens.householdOnboarding.pictureStep',
  'screens.householdOnboarding.passkeyStep',
];

const PICTURE_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

const SAYS: Record<(typeof STEPS)[number], StringKey> = {
  name: 'screens.householdOnboarding.nameLede',
  picture: 'screens.householdOnboarding.pictureLede',
  passkey: 'screens.householdOnboarding.passkeyLede',
};

/**
 * Sets a household up the first time somebody signs into it.
 *
 * Three steps, and no more, because nobody asked to be here — this stands between somebody and the
 * thing they opened Valence for. A name and a picture, which are the two things that are blank and
 * visible and have no other moment to be set, and then the offer of a passkey, which is the one
 * thing that is easier now than it will ever be again.
 *
 * It stands on the same ground the way in does, and that is not decoration. Signing in and setting
 * up are one continuous moment to the person going through them, and a bare form arriving after the
 * way in reads as two different pieces of software bolted together.
 *
 * Nothing is recorded as finished until the last step is pressed. Somebody who closes the tab
 * halfway is offered it again, on the step they left, rather than being remembered as done.
 *
 * @param household - The household as it stands, which names the first field.
 * @param onDone - Told when setting up is finished, so the shell can let them through.
 */
const HouseholdOnboarding = ({ household, onDone }: HouseholdOnboardingProps) => {
  const [step, setStep] = useState<(typeof STEPS)[number]>('name');
  const [name, setName] = useState(household.name);
  const [wrong, setWrong] = useState<string | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passkeyName, setPasskeyName] = useState(() =>
    say('screens.householdOnboarding.thisDevice'),
  );
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isWelcoming, setIsWelcoming] = useState(false);

  const asking = useQuery(sessionQueries.wayIn());
  const noPasskeys = describePasskeyUnavailability();

  const travel = useTravelDirection([...STEPS], step);
  const at = STEPS.indexOf(step);

  const keepTheName = async (): Promise<void> => {
    const said = whatIsWrongWithTheName(name);

    setWrong(said);

    if (said !== null) {
      return;
    }

    setIsSaving(true);

    const saved = await saveHousehold({ name: name.trim() });

    setIsSaving(false);

    if (saved === null) {
      setWrong(say('screens.householdOnboarding.notSaved'));

      return;
    }

    setStep('picture');
  };

  const keepThePicture = async (chosen: File): Promise<void> => {
    setIsSaving(true);

    const said = await uploadHouseholdPhoto(chosen);

    setIsSaving(false);
    setWrong(said);

    if (said === null) {
      setPicture(chosen);
    }
  };

  const keepAPasskey = async (): Promise<void> => {
    setIsSaving(true);

    const outcome = await registerPasskey(
      passkeyName.trim() === '' ? say('screens.householdOnboarding.thisDevice') : passkeyName,
    );

    setIsSaving(false);

    if (outcome.kind === 'registered') {
      setHasPasskey(true);
      setWrong(null);

      return;
    }

    setWrong(outcome.kind === 'cancelled' ? null : outcome.reason);
  };

  const finish = async (): Promise<void> => {
    setIsSaving(true);

    const done = await finishOnboarding();

    setIsSaving(false);

    if (done) {
      setIsWelcoming(true);
    }
  };

  if (isWelcoming) {
    return (
      <main className="relative flex min-h-svh flex-col overflow-hidden">
        <WayInBackground splashscreen={asking.data?.splashscreen ?? null} />

        <WelcomeToValence
          name={say('common.valence')}
          household={name.trim()}
          onFinished={onDone}
        />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden px-6 py-16">
      <WayInBackground splashscreen={asking.data?.splashscreen ?? null} />

      <motion.span
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Logo size={44} isSolid label={say('common.valence')} />
      </motion.span>

      <GlassPanel
        elevation="floating"
        radius="large"
        className="flex w-full max-w-md flex-col gap-6 p-8"
      >
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {say('screens.householdOnboarding.heading')}
          </h1>

          <p className="text-sm leading-relaxed text-text-muted">{say(SAYS[step])}</p>
        </header>

        <Tabs value={step} onValueChange={() => undefined} className="flex w-full flex-col">
          <TabPanel value="name" travel={travel}>
            <div className="flex flex-col gap-5">
              <TextField
                label={say('screens.householdOnboarding.nameLabel')}
                value={name}
                onValueChange={setName}
                description={say('screens.householdOnboarding.nameDescription')}
                hasFocusOnMount
                {...(wrong === null ? {} : { error: wrong })}
              />

              <Button
                variant="glossy"
                size="lg"
                className="w-full"
                isLoading={isSaving}
                onClick={() => {
                  void keepTheName();
                }}
              >
                {say('screens.householdOnboarding.continue')}
              </Button>
            </div>
          </TabPanel>

          <TabPanel value="picture" travel={travel}>
            <div className="flex flex-col items-center gap-5">
              <HouseholdFace household={household} pending={picture} className="size-24 text-3xl" />

              {wrong === null ? null : (
                <p role="alert" className="text-center text-sm text-danger">
                  {wrong}
                </p>
              )}

              <FilePicker
                label={say('screens.householdOnboarding.choosePicture')}
                accept={PICTURE_TYPES}
                variant="secondary"
                size="lg"
                isLoading={isSaving}
                isActive={picture !== null}
                className="w-full"
                onPick={(chosen) => {
                  void keepThePicture(chosen);
                }}
              >
                <Icon of={ImageIcon} size={18} />
                {picture === null
                  ? say('screens.householdOnboarding.choosePicture')
                  : say('screens.householdOnboarding.pickAnother')}
              </FilePicker>

              <Button
                variant="glossy"
                size="lg"
                className="w-full"
                onClick={() => {
                  setWrong(null);
                  setStep('passkey');
                }}
              >
                {picture === null
                  ? say('screens.householdOnboarding.notNow')
                  : say('screens.householdOnboarding.continue')}
              </Button>
            </div>
          </TabPanel>

          <TabPanel value="passkey" travel={travel}>
            <div className="flex flex-col gap-5">
              {noPasskeys !== null ? (
                <p className="text-center text-sm text-text-muted">{noPasskeys}</p>
              ) : hasPasskey ? (
                <p className="text-center text-sm text-text">
                  {say('screens.householdOnboarding.passkeyAdded')}
                </p>
              ) : (
                <>
                  <TextField
                    label={say('screens.householdOnboarding.passkeyNameLabel')}
                    value={passkeyName}
                    onValueChange={setPasskeyName}
                    description={say('screens.householdOnboarding.passkeyNameDescription')}
                    {...(wrong === null ? {} : { error: wrong })}
                  />

                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    isLoading={isSaving}
                    onClick={() => {
                      void keepAPasskey();
                    }}
                  >
                    <Icon of={KeyIcon} size={18} />
                    {say('screens.householdOnboarding.addPasskey')}
                  </Button>
                </>
              )}

              <Button
                variant="glossy"
                size="lg"
                className="w-full"
                isLoading={isSaving}
                onClick={() => {
                  void finish();
                }}
              >
                {say('screens.householdOnboarding.finish')}
              </Button>
            </div>
          </TabPanel>
        </Tabs>

        <PageDots
          count={STEPS.length}
          selectedIndex={at}
          labels={LABELS.map((key) => say(key))}
          label={say('screens.householdOnboarding.dotsLabel')}
          onSelect={() => undefined}
          className="self-center"
        />
      </GlassPanel>
    </main>
  );
};

HouseholdOnboarding.displayName = 'HouseholdOnboarding';

export { HouseholdOnboarding };
