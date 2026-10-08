import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bin as BinIcon, Plus as PlusIcon } from '@keyline-icons/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { saveHousehold } from '@ValenceClient/household/fetchHousehold';
import { createProfile, removeProfile } from '@ValenceClient/profiles/fetchProfiles';
import { householdQueries } from '@ValenceClient/query/householdQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { say } from '@ValenceI18n/say';
import { whatIsWrongWithTheName } from '@ValenceScreens/components/HouseholdOnboarding/whatIsWrongWithTheName';
import { HouseholdPicturePicker } from '@ValenceScreens/components/HouseholdPicturePicker/HouseholdPicturePicker';
import { PasskeyOffer } from '@ValenceScreens/components/PasskeyOffer/PasskeyOffer';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import type { HouseholdStepProps } from './HouseholdStep.types';

/**
 * The household this account is: what it is called, its picture, the people who watch on it, each
 * with a profile of their own, and a passkey for signing in. The same household and profiles the
 * account section and the way in show, written as they are chosen.
 *
 * @param onBack - Told to go back to the profile.
 * @param onContinue - Told to go on with the household's name, once it is saved.
 */
const HouseholdStep = ({ onBack, onContinue }: HouseholdStepProps) => {
  const cache = useQueryClient();
  const prefersReducedMotion = useReducedMotionConfig();
  const asked = useQuery(householdQueries.onboarding());
  const people = useQuery(profileQueries.all());
  const me = useQuery(profileQueries.watching());
  const household = asked.data?.household ?? null;
  const [name, setName] = useState<string | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [newcomer, setNewcomer] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const called = name ?? household?.name ?? '';
  const everyone = people.data ?? [];

  useEffect(() => {
    setWrong(null);
  }, [name]);

  const readPeople = async () => {
    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  const add = async () => {
    const wanted = newcomer.trim();

    if (wanted === '') {
      return;
    }

    setIsAdding(true);
    setProblem(null);

    const isAdded = await createProfile(
      wanted,
      PROFILE_COLOURS[(everyone.length + 1) % PROFILE_COLOURS.length] ?? PROFILE_COLOURS[0],
    );

    setIsAdding(false);

    if (!isAdded) {
      setProblem(say('screens.setupWizard.householdStep.thatPersonCouldNotBeAdded'));

      return;
    }

    setNewcomer('');
    await readPeople();
  };

  const save = async () => {
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

    await cache.invalidateQueries({ queryKey: householdQueries.key });
    onContinue(called.trim());
  };

  return (
    <SetupStepFrame
      title={say('screens.householdOnboarding.setUpYourHousehold')}
      lead={say('screens.householdOnboarding.everybodyWhoWatchesHereSharesThis')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <Button
          variant="confirm"
          size="lg"
          isLoading={isSaving}
          disabled={household === null}
          onClick={() => {
            void save();
          }}
        >
          {say('common.continue')}
          <Icon of={ArrowRightIcon} size={16} />
        </Button>
      }
    >
      {household === null ? (
        <Spinner size="sm" label={say('screens.profileGate.readingWhoIsHere')} />
      ) : (
        <>
          <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <TextField
              label={say('screens.householdOnboarding.whatIsThisHouseholdCalled')}
              value={called}
              onValueChange={setName}
              description={say('screens.householdOnboarding.yoursYourFamilysWhateverTheTelevision')}
              descriptionPlacement="below"
              {...(wrong === null ? {} : { error: wrong })}
            />

            <HouseholdPicturePicker
              household={{ ...household, name: called === '' ? household.name : called }}
              picture={picture}
              onPicked={setPicture}
            />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text">
              {say('screens.setupWizard.householdStep.whoWatchesHereHeading')}
            </h2>

            <p className="text-sm leading-relaxed text-text-muted">
              {say('screens.setupWizard.householdStep.eachPersonGetsAProfile')}
            </p>

            <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-hover)]">
              <AnimatePresence initial={false}>
                {everyone.map((person) => (
                  <motion.li
                    key={person.id}
                    layout="position"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={revealTransition(prefersReducedMotion)}
                    className="border-b border-[var(--surface-line)] last:border-b-0"
                  >
                    <div className="flex items-center gap-3 py-2 pl-3 pr-1.5">
                      <ProfileFace profile={person} className="size-8 shrink-0 text-xs" />

                      <span className="min-w-0 flex-1 truncate text-sm text-text">
                        {person.name}
                      </span>

                      {person.id === me.data?.id ? (
                        <span className="text-xs text-text-muted">
                          {say('screens.ratingPanel.you')}
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="xs"
                          isIconOnly
                          label={say('common.forgetName', {
                            name: person.name,
                          })}
                          onClick={() => {
                            void removeProfile(person.id).then(readPeople);
                          }}
                        >
                          <Icon of={BinIcon} size={16} />
                        </Button>
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <form
              noValidate
              className="flex items-start gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void add();
              }}
            >
              <TextField
                label={say('screens.setupWizard.householdStep.addSomebody')}
                isLabelHidden
                value={newcomer}
                onValueChange={setNewcomer}
                placeholder={say('common.name')}
                autoComplete="off"
                className="min-w-0 flex-1"
                descriptionPlacement="below"
                {...(problem === null ? {} : { error: problem })}
              />

              <Button
                type="submit"
                variant="secondary"
                isLoading={isAdding}
                disabled={newcomer.trim() === ''}
              >
                <Icon of={PlusIcon} size={16} />
                {say('common.add')}
              </Button>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text">
              {say('screens.householdOnboarding.passkey')}
            </h2>

            <p className="text-sm leading-relaxed text-text-muted">
              {say('screens.householdOnboarding.aPasskeyIsOptional')}
            </p>

            <PasskeyOffer className="max-w-sm" />
          </section>
        </>
      )}
    </SetupStepFrame>
  );
};

HouseholdStep.displayName = 'HouseholdStep';

export { HouseholdStep };
