import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { GlassPanel } from '@ValenceUI/GlassPanel';
import { PageDots } from '@ValenceUI/PageDots';
import { TabPanel } from '@ValenceUI/TabPanel';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { householdQueries } from '@ValenceClient/query/householdQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { finishOnboarding, saveHousehold } from '@ValenceClient/household/fetchHousehold';
import {
  readGetStartedProgress,
  saveGetStartedProgress,
} from '@ValenceClient/getStarted/getStartedProgress';
import { WayInBackground } from '@ValenceScreens/components/WayInBackground/WayInBackground';
import { WayInMark } from '@ValenceScreens/components/WayInMark/WayInMark';
import { FaceEditor } from '@ValenceScreens/components/FaceEditor/FaceEditor';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { useSignInStanding } from '@ValenceScreens/passkeys/useSignInStanding';
import { draftOfProfile } from '@ValenceScreens/profiles/draftOfProfile';
import { saveProfileDraft } from '@ValenceScreens/profiles/saveProfileDraft';
import { PasskeyStep } from './components/PasskeyStep/PasskeyStep';
import { PeopleStep } from './components/PeopleStep/PeopleStep';
import { WelcomeToValence } from '@ValenceScreens/components/WelcomeToValence/WelcomeToValence';
import { whatIsWrongWithTheName } from './whatIsWrongWithTheName';
import type { FaceChoice } from '@ValenceScreens/components/FaceEditor/FaceEditor.types';
import type { HouseholdOnboardingProps } from './HouseholdOnboarding.types';
import { say } from '@ValenceI18n/say';

const STEPS = ['name', 'picture', 'people', 'passkey'] as const;

const LABELS = [
  say('common.name'),
  say('common.picture'),
  say('common.profiles'),
  say('screens.householdOnboarding.passkey'),
];

const SAYS = {
  name: say('screens.householdOnboarding.everybodyWhoWatchesHereSharesThis'),
  picture: say('screens.householdOnboarding.giveTheHouseholdAPictureOr'),
  people: say('screens.householdOnboarding.whoElseWatchesHere'),
};

const PASSKEY_SAYS = {
  reading: say('screens.householdOnboarding.aPasskeyIsOptional'),
  mayAddAPasskey: say('screens.householdOnboarding.aPasskeyIsOptional'),
  hasPasskey: say('screens.householdOnboarding.youHaveAPasskeyForThisAccount'),
  needsAWayIn: say('screens.householdOnboarding.yourAccountHasNoPasswordOrPasskey'),
};

/**
 * Sets an account up the first time somebody signs into it: their name, their face, who else
 * watches with them, and a passkey.
 *
 * Four short steps, and no more, because nobody asked to be here — this stands between somebody and
 * the thing they opened Valence for. A name and a face, which are blank and visible and have no
 * other moment to be set, made with the same editor the profile uses later; then anybody else who
 * watches; then the offer of a passkey, which is easier now than it will ever be again. The offer is
 * optional, except to an account that has no password and no passkey either, which is held there
 * until it has one. Any step already passed can be gone back to.
 *
 * It stands on the same ground, under the same mark, as the way in, and stays where it is as the
 * steps change, since signing in and setting up are one continuous moment to the person going
 * through them.
 *
 * Nothing is recorded as finished until the last step is pressed. Somebody who closes the tab
 * halfway is offered it again rather than being remembered as done. Passing the passkey by here is
 * remembered, so the list of things to try next does not ask again straight away.
 *
 * @param accountId - Whose account is being set up.
 * @param name - What this server calls itself.
 * @param household - The account as it stands, which names the first field.
 * @param onDone - Told when setting up is finished, so the shell can let them through.
 */
const HouseholdOnboarding = ({ accountId, name, household, onDone }: HouseholdOnboardingProps) => {
  const cache = useQueryClient();
  const [step, setStep] = useState<(typeof STEPS)[number]>('name');
  const [called, setCalled] = useState(household.name);
  const [wrong, setWrong] = useState<string | null>(null);
  const [face, setFace] = useState<FaceChoice | null>(null);
  const [isEditingFace, setIsEditingFace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWelcoming, setIsWelcoming] = useState(false);

  const asking = useQuery(sessionQueries.wayIn());
  const me = useQuery(profileQueries.watching());
  const standing = useSignInStanding();

  const travel = useTravelDirection([...STEPS], step);
  const at = STEPS.indexOf(step);

  const readEverybodyAgain = async (): Promise<void> => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: profileQueries.key }),
      cache.invalidateQueries({ queryKey: householdQueries.key }),
      cache.invalidateQueries({ queryKey: sessionQueries.key }),
    ]);
  };

  const goTo = (next: (typeof STEPS)[number]): void => {
    setWrong(null);
    setStep(next);
  };

  const keepTheName = async (): Promise<void> => {
    const said = whatIsWrongWithTheName(called);

    setWrong(said);

    if (said !== null) {
      return;
    }

    setIsSaving(true);

    const saved = await saveHousehold({ name: called.trim() });

    setIsSaving(false);

    if (saved === null) {
      setWrong(say('screens.householdOnboarding.thatNameCouldNotBeSaved'));

      return;
    }

    await readEverybodyAgain();
    goTo('picture');
  };

  const keepTheFace = async (choice: FaceChoice): Promise<void> => {
    const profile = me.data;

    setIsEditingFace(false);

    if (profile === undefined || profile === null) {
      return;
    }

    setIsSaving(true);

    const refused = await saveProfileDraft(profile, {
      ...draftOfProfile(profile),
      name: called.trim(),
      ...choice,
    });

    setIsSaving(false);
    setWrong(refused);

    if (refused !== null) {
      return;
    }

    setFace(choice);
    await readEverybodyAgain();
  };

  const finish = async (): Promise<void> => {
    setIsSaving(true);

    const done = await finishOnboarding();

    setIsSaving(false);

    if (!done) {
      return;
    }

    if (standing !== 'hasPasskey') {
      const progress = readGetStartedProgress(accountId);

      saveGetStartedProgress(accountId, {
        skipped: [...new Set([...progress.skipped, 'passkey'])],
      });
    }

    setIsWelcoming(true);
  };

  if (isWelcoming) {
    return (
      <main className="relative flex min-h-svh flex-col overflow-hidden">
        <WayInBackground splashscreen={asking.data?.splashscreen ?? null} />

        <WelcomeToValence name={name} onFinished={onDone} />
      </main>
    );
  }

  const profile = me.data ?? null;

  return (
    <main className="relative flex min-h-svh flex-col items-center gap-8 overflow-hidden px-6 pb-16 pt-[max(4rem,14vh)]">
      <WayInBackground splashscreen={asking.data?.splashscreen ?? null} />

      <WayInMark name={name} isSmall />

      <GlassPanel
        elevation="floating"
        radius="large"
        className="flex w-full max-w-md flex-col gap-6 p-8"
      >
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            {say('server.email.composeLinkEmail.setUpYourAccount')}
          </h1>

          <p className="text-sm leading-relaxed text-text-muted">
            {step === 'passkey' ? PASSKEY_SAYS[standing] : SAYS[step]}
          </p>
        </header>

        <Tabs value={step} onValueChange={() => undefined} className="flex w-full flex-col">
          <TabPanel value="name" travel={travel}>
            <div className="flex flex-col gap-5">
              <TextField
                label={say('screens.accountArea.profileSettings.displayName')}
                value={called}
                onValueChange={setCalled}
                description={say(
                  'screens.householdOnboarding.yoursYourFamilysWhateverTheTelevision',
                )}
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
                {say('common.continue')}
              </Button>
            </div>
          </TabPanel>

          <TabPanel value="picture" travel={travel}>
            <div className="flex flex-col items-center gap-5">
              {profile === null ? null : (
                <ProfileFace
                  profile={{
                    ...profile,
                    name: called.trim() === '' ? profile.name : called.trim(),
                    ...(face === null ? {} : { avatar: face.avatar, colour: face.colour }),
                  }}
                  pending={face?.photo ?? null}
                  className="size-24 text-3xl"
                />
              )}

              {wrong === null ? null : (
                <p role="alert" className="text-center text-sm text-danger">
                  {wrong}
                </p>
              )}

              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                isLoading={isSaving}
                disabled={profile === null}
                onClick={() => {
                  setIsEditingFace(true);
                }}
              >
                <Icon of={ImageIcon} size={18} />
                {face === null
                  ? say('common.chooseAPicture')
                  : say('screens.householdOnboarding.pickAnother')}
              </Button>

              <Button
                variant="glossy"
                size="lg"
                className="w-full"
                disabled={isSaving}
                onClick={() => {
                  goTo('people');
                }}
              >
                {face === null ? say('common.notNow') : say('common.continue')}
              </Button>
            </div>

            {profile === null ? null : (
              <FaceEditor
                isOpen={isEditingFace}
                onClose={() => {
                  setIsEditingFace(false);
                }}
                profile={profile}
                start={face ?? { avatar: profile.avatar, photo: null, colour: profile.colour }}
                onUse={(choice) => {
                  void keepTheFace(choice);
                }}
              />
            )}
          </TabPanel>

          <TabPanel value="people" travel={travel}>
            <PeopleStep
              onDone={() => {
                goTo('passkey');
              }}
            />
          </TabPanel>

          <TabPanel value="passkey" travel={travel}>
            <PasskeyStep
              isFinishing={isSaving}
              onFinish={() => {
                void finish();
              }}
            />
          </TabPanel>
        </Tabs>

        <div className="flex flex-col items-center gap-3">
          {at === 0 ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                goTo(STEPS[at - 1] ?? 'name');
              }}
            >
              {say('common.back')}
            </Button>
          )}

          <PageDots
            count={STEPS.length}
            selectedIndex={at}
            labels={LABELS}
            label={say('screens.householdOnboarding.settingUp')}
            onSelect={(index) => {
              const earlier = STEPS[index];

              if (index < at && earlier !== undefined) {
                goTo(earlier);
              }
            }}
          />
        </div>
      </GlassPanel>
    </main>
  );
};

HouseholdOnboarding.displayName = 'HouseholdOnboarding';

export { HouseholdOnboarding };
