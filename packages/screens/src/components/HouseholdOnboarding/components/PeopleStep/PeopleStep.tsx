import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { ProfileRoster } from '@ValenceScreens/components/ProfileRoster/ProfileRoster';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { PeopleStepProps } from './PeopleStep.types';
import { say } from '@ValenceI18n/say';

/**
 * Asks who else watches in this household while it is being set up, so each of them gets a profile
 * of their own from the start.
 *
 * @param onDone - Told once the household has who it needs.
 */
const PeopleStep = ({ onDone }: PeopleStepProps) => {
  const cache = useQueryClient();
  const list = useQuery(profileQueries.list());
  const [problem, setProblem] = useState<string | null>(null);

  const profiles = list.data?.profiles ?? [];

  const add = async (name: string, colour: ProfileColour) => {
    const refused = await changeProfiles({ path: '', method: 'POST', body: { name, colour } });

    setProblem(refused);

    if (refused !== null) {
      return false;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });

    return true;
  };

  return (
    <div className="flex flex-col gap-5">
      <ProfileRoster profiles={profiles} onAdd={add} />

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      <Button
        variant="glossy"
        size="lg"
        className="w-full"
        disabled={!list.isSuccess}
        onClick={onDone}
      >
        {profiles.length > 1 ? say('common.continue') : say('common.notNow')}
      </Button>
    </div>
  );
};

PeopleStep.displayName = 'PeopleStep';

export { PeopleStep };
