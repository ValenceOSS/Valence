import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { PageDots } from '@ValenceUI/PageDots';
import { PasskeySetup } from '@ValenceScreens/components/PasskeySetup/PasskeySetup';
import { TabPanel } from '@ValenceUI/TabPanel';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import {
  finishOnboarding,
  saveHousehold,
  uploadHouseholdPhoto,
} from '@ValenceClient/household/fetchHousehold';
import { householdAvatarUrl } from '@ValenceContracts/schemas/Household';
import { whatIsWrongWithTheName } from './whatIsWrongWithTheName';
import type { HouseholdOnboardingProps } from './HouseholdOnboarding.types';

const STEPS = ['name', 'picture', 'passkey'] as const;

const LABELS = ['Name', 'Picture', 'Passkey'];

const PICTURE_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

/**
 * Sets a household up the first time somebody signs into it.
 *
 * Three steps, and no more, because nobody asked to be here — this stands between somebody and the
 * thing they opened Valence for. A name and a picture, which are the two things that are blank and
 * visible and have no other moment to be set, and then the offer of a passkey, which is the one
 * thing that is easier now than it will ever be again.
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
      setWrong('That name could not be saved.');

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

  const finish = async (): Promise<void> => {
    setIsSaving(true);

    const done = await finishOnboarding();

    setIsSaving(false);

    if (done) {
      onDone();
    }
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text">Set up your household</h1>

        <p className="text-sm text-text-muted">
          Everybody who watches here shares this. It takes a moment and you will not be asked again.
        </p>
      </header>

      <Tabs value={step} onValueChange={() => undefined} className="flex w-full flex-col">
        <TabPanel value="name" travel={travel} className="flex flex-col gap-4">
          <TextField
            label="What is this household called?"
            value={name}
            onValueChange={setName}
            description="Yours, your family's, whatever the television gets called."
            hasFocusOnMount
            {...(wrong === null ? {} : { error: wrong })}
          />

          <Button
            variant="glossy"
            size="lg"
            isLoading={isSaving}
            onClick={() => {
              void keepTheName();
            }}
          >
            Continue
          </Button>
        </TabPanel>

        <TabPanel value="picture" travel={travel} className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            {picture === null
              ? 'Give the household a picture, or carry on without one.'
              : 'That is the one. Carry on, or pick another.'}
          </p>

          <img
            src={picture === null ? householdAvatarUrl(household) : URL.createObjectURL(picture)}
            alt=""
            className="size-32 self-center rounded-full bg-subtle object-cover"
          />

          {wrong === null ? null : <p className="text-sm text-danger">{wrong}</p>}

          <FilePicker
            label="Choose a picture"
            accept={PICTURE_TYPES}
            disabled={isSaving}
            onPick={(chosen) => {
              void keepThePicture(chosen);
            }}
          >
            <Button variant="secondary" size="lg" isLoading={isSaving}>
              {picture === null ? 'Choose a picture' : 'Pick another'}
            </Button>
          </FilePicker>

          <Button
            variant="glossy"
            size="lg"
            onClick={() => {
              setWrong(null);
              setStep('passkey');
            }}
          >
            {picture === null ? 'Not now' : 'Continue'}
          </Button>
        </TabPanel>

        <TabPanel value="passkey" travel={travel} className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            A passkey signs you in with your face, your fingerprint or your screen lock, and there
            is no password to forget. You can add one later from your account.
          </p>

          <PasskeySetup />

          <Button
            variant="glossy"
            size="lg"
            isLoading={isSaving}
            onClick={() => {
              void finish();
            }}
          >
            Finish
          </Button>
        </TabPanel>
      </Tabs>

      <PageDots
        count={STEPS.length}
        selectedIndex={at}
        labels={LABELS}
        label="Setting up"
        onSelect={() => undefined}
        className="self-center"
      />
    </main>
  );
};

HouseholdOnboarding.displayName = 'HouseholdOnboarding';

export { HouseholdOnboarding };
