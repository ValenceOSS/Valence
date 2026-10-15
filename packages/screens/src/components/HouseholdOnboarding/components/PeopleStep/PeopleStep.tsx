import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { holdsMoreThanEveryProfile } from '@ValenceContracts/functions/holdsMoreThanEveryProfile';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import type { PeopleStepProps } from './PeopleStep.types';
import { say } from '@ValenceI18n/say';

const PIN = /^\d{4,8}$/u;

const MOST_PROFILES = 6;

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
  const [newcomer, setNewcomer] = useState('');
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
    list.isSuccess && !held.isPending && (!needsAPin || (PIN.test(pin) && pin === again));

  const add = async () => {
    const wanted = newcomer.trim();

    if (wanted === '') {
      return;
    }

    setIsBusy(true);

    const refused = await changeProfiles({
      path: '',
      method: 'POST',
      body: {
        name: wanted,
        colour: PROFILE_COLOURS[profiles.length % PROFILE_COLOURS.length] ?? PROFILE_COLOURS[0],
      },
    });

    setIsBusy(false);
    setProblem(refused);

    if (refused === null) {
      setNewcomer('');
      await cache.invalidateQueries({ queryKey: profileQueries.key });
    }
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
      <ul className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-hover)]">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center gap-3 border-b border-[var(--surface-line)] px-3 py-2 last:border-b-0"
          >
            <ProfileFace profile={profile} className="size-8 shrink-0 text-xs" />

            <span className="min-w-0 flex-1 truncate text-sm text-text">{profile.name}</span>

            {profile.isOwner ? (
              <span className="text-xs text-text-muted">{say('screens.ratingPanel.you')}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {profiles.length >= MOST_PROFILES ? null : (
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
          />

          <Button
            type="submit"
            variant="secondary"
            isLoading={isBusy}
            disabled={newcomer.trim() === ''}
          >
            <Icon of={PlusIcon} size={16} />
            {say('common.add')}
          </Button>
        </form>
      )}

      {needsAPin ? (
        <section className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-text-muted">
            {say('screens.householdOnboarding.yourProfileNeedsAPin')}
          </p>

          <TextField
            label={say('screens.whoIsWatching.newPin')}
            description={say('screens.whoIsWatching.fourToEightDigits')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={pin}
            onValueChange={(typed) => {
              setPin(typed.replace(/\D/gu, '').slice(0, 8));
            }}
          />

          <TextField
            label={say('screens.whoIsWatching.typeThePinAgain')}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={again}
            onValueChange={(typed) => {
              setAgain(typed.replace(/\D/gu, '').slice(0, 8));
            }}
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
