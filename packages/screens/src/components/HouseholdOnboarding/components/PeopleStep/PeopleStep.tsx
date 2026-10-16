import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { PinField } from '@ValenceUI/PinField';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { holdsMoreThanEveryProfile } from '@ValenceContracts/functions/holdsMoreThanEveryProfile';
import { ProfileRoster } from '@ValenceScreens/components/ProfileRoster/ProfileRoster';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { PeopleStepProps } from './PeopleStep.types';
import { say } from '@ValenceI18n/say';
import { isAPin } from '@ValenceContracts/functions/isAPin';

/**
 * Asks who else watches in this household while it is being set up, so each of them gets a profile
 * of their own from the start. An account that can do more than watch asks its owner for a PIN as
 * soon as anybody else shares it, since the next screen anybody sees will ask who is watching. Where
 * what the account may do cannot be read, it asks for the PIN anyway rather than let it be skipped.
 *
 * @param onDone - Told once the household has who it needs, and a PIN where one is needed.
 */
const PeopleStep = ({ onDone }: PeopleStepProps) => {
  const cache = useQueryClient();
  const list = useQuery(profileQueries.list());
  const held = useQuery(sessionQueries.permissions());
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const profiles = list.data?.profiles ?? [];
  const owner = profiles.find((profile) => profile.isOwner) ?? null;
  const needsAPin =
    profiles.length > 1 &&
    owner !== null &&
    !owner.hasPin &&
    (held.isError || holdsMoreThanEveryProfile(new Set(held.data?.permissions ?? [])));
  const isReady =
    list.isSuccess && !held.isPending && (!needsAPin || (isAPin(pin) && pin === again));

  const add = async (name: string, colour: ProfileColour) => {
    const refused = await changeProfiles({ path: '', method: 'POST', body: { name, colour } });

    setProblem(refused);

    if (refused !== null) {
      return false;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });

    return true;
  };

  const carryOn = async () => {
    if (needsAPin) {
      setIsBusy(true);

      const refused = await changeProfiles({
        path: `/${owner.id}/pin`,
        method: 'PUT',
        body: { pin },
      });

      setIsBusy(false);

      if (refused !== null) {
        setProblem(refused);

        return;
      }

      await cache.invalidateQueries({ queryKey: profileQueries.key });
    }

    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <ProfileRoster profiles={profiles} onAdd={add} />

      {needsAPin ? (
        <section className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-text-muted">
            {say('screens.householdOnboarding.yourProfileNeedsAPin')}
          </p>

          <PinField
            label={say('screens.whoIsWatching.newPin')}
            description={say('screens.whoIsWatching.fourToEightDigits')}
            isNew
            value={pin}
            onValueChange={setPin}
          />

          <PinField
            label={say('screens.whoIsWatching.typeThePinAgain')}
            isNew
            value={again}
            onValueChange={setAgain}
            {...(again !== '' && again !== pin
              ? { error: say('screens.whoIsWatching.thosePinsDoNotMatch') }
              : {})}
          />
        </section>
      ) : null}

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      <Button
        variant="glossy"
        size="lg"
        className="w-full"
        isLoading={isBusy}
        disabled={!isReady}
        onClick={() => {
          void carryOn();
        }}
      >
        {profiles.length > 1 ? say('common.continue') : say('common.notNow')}
      </Button>
    </div>
  );
};

PeopleStep.displayName = 'PeopleStep';

export { PeopleStep };
