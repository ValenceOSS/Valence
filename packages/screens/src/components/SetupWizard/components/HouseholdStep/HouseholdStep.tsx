import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { createProfile } from '@ValenceClient/profiles/fetchProfiles';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { say } from '@ValenceI18n/say';
import { ForgetProfileButton } from '@ValenceScreens/components/ForgetProfileButton/ForgetProfileButton';
import { PasskeyOffer } from '@ValenceScreens/components/PasskeyOffer/PasskeyOffer';
import { ProfileRoster } from '@ValenceScreens/components/ProfileRoster/ProfileRoster';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { HouseholdStepProps } from './HouseholdStep.types';

/**
 * The people who watch on this account, each with a profile of their own, and a passkey for
 * signing in. The person setting up already chose their own name and picture on the step before,
 * and the account goes by those until somebody gives it its own. The same list, added to and taken
 * from the same way, as the first sign-in of any other account.
 *
 * @param onBack - Told to go back to the profile.
 * @param onContinue - Told to go on.
 */
const HouseholdStep = ({ onBack, onContinue }: HouseholdStepProps) => {
  const cache = useQueryClient();
  const people = useQuery(profileQueries.list());
  const [problem, setProblem] = useState<string | null>(null);

  const readPeople = async () => {
    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  const add = async (name: string, colour: ProfileColour): Promise<boolean> => {
    setProblem(null);

    const isAdded = await createProfile(name, colour);

    if (!isAdded) {
      setProblem(say('screens.setupWizard.householdStep.thatPersonCouldNotBeAdded'));

      return false;
    }

    await readPeople();

    return true;
  };

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.householdStep.whoWatchesHereHeading')}
      lead={say('screens.setupWizard.householdStep.eachPersonGetsAProfile')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <Button variant="confirm" size="lg" disabled={people.isPending} onClick={onContinue}>
          {say('common.continue')}
          <Icon of={ArrowRightIcon} size={16} />
        </Button>
      }
    >
      {people.isPending ? (
        <Spinner size="sm" label={say('screens.profileGate.readingWhoIsHere')} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <ProfileRoster
              profiles={people.data?.profiles ?? []}
              menuFor={(profile) => (
                <ForgetProfileButton
                  profile={profile}
                  onForgotten={() => {
                    void readPeople();
                  }}
                />
              )}
              onAdd={add}
            />

            {problem === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {problem}
              </p>
            )}
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
