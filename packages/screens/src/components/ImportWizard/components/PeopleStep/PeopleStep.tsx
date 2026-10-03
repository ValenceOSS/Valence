import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { fetchImportPeople } from '@ValenceClient/imports/fetchImportPeople';
import { givePlexPin } from '@ValenceClient/imports/givePlexPin';
import type { MediaImportPerson } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { PeopleStepProps } from './PeopleStep.types';

const NOBODY = '';

/**
 * Who comes across: everybody on the old server, each of whom can be left out, which of them is the
 * administrator doing this so their own account is used rather than a new one made, and a Plex
 * Home member's PIN where one is needed to read their watching.
 *
 * @param source - The server being brought across.
 * @param onContinue - Told who to leave out and which of them is the administrator.
 * @param onBack - Told to go back a step.
 */
const PeopleStep = ({ source, onContinue, onBack }: PeopleStepProps) => {
  const [people, setPeople] = useState<MediaImportPerson[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [left, setLeft] = useState<ReadonlySet<string>>(new Set());
  const [me, setMe] = useState<string | null>(null);
  const [pins, setPins] = useState<Readonly<Record<string, string>>>({});
  const [pinProblems, setPinProblems] = useState<Readonly<Record<string, string>>>({});

  const read = useCallback(async () => {
    setProblem(null);

    const answer = await fetchImportPeople(source.id);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setPeople(answer.value.people);
    setMe((held) => held ?? answer.value.people.find((one) => one.isAdministrator)?.id ?? null);
  }, [source.id]);

  useEffect(() => {
    void read();
  }, [read]);

  if (problem !== null) {
    return (
      <CouldNotRead
        said={problem}
        isTryingAgain={false}
        onTryAgain={() => {
          void read();
        }}
      />
    );
  }

  if (people === null) {
    return (
      <Spinner
        isCentered
        size="sm"
        label={say('screens.importWizard.peopleStep.readingWhoIsOnIt')}
      />
    );
  }

  const giveTheirPin = async (person: MediaImportPerson) => {
    const answer = await givePlexPin(source.id, { userId: person.id, pin: pins[person.id] ?? '' });

    if (answer.kind === 'refused') {
      setPinProblems((held) => ({
        ...held,
        [person.id]: answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'),
      }));

      return;
    }

    setPinProblems((held) => ({ ...held, [person.id]: '' }));
    await read();
  };

  return (
    <div className="flex flex-col gap-6">
      <PanelCard
        title={say('screens.importWizard.peopleStep.everybodyOnSource', { source: source.name })}
      >
        <div className="flex flex-col gap-5">
          <Choice
            label={say('screens.importWizard.peopleStep.whichOfThemIsYou')}
            options={[
              { id: NOBODY, label: say('screens.importWizard.peopleStep.noneOfThem') },
              ...people.map((person) => ({ id: person.id, label: person.name })),
            ]}
            value={me ?? NOBODY}
            onSelect={(id) => {
              setMe(id === NOBODY ? null : id);
            }}
          />

          <p className="text-sm text-text-muted">
            {say('screens.importWizard.peopleStep.yourOwnAccountIsUsedForYou')}
          </p>

          <ul className="flex flex-col gap-4">
            {people.map((person) => (
              <li key={person.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    label={person.name}
                    checked={!left.has(person.id)}
                    onCheckedChange={(checked) => {
                      setLeft((held) => {
                        const next = new Set(held);

                        if (checked) {
                          next.delete(person.id);
                        } else {
                          next.add(person.id);
                        }

                        return next;
                      });
                    }}
                  />

                  {person.isAdministrator ? (
                    <Badge size="sm" tone="quiet">
                      {say('common.administrator')}
                    </Badge>
                  ) : null}

                  {person.isDisabled ? (
                    <Badge size="sm" tone="quiet">
                      {say('screens.importWizard.peopleStep.disabled')}
                    </Badge>
                  ) : null}
                </div>

                {person.access === 'needsPin' ? (
                  <div className="flex flex-wrap items-end gap-2 pl-7">
                    <TextField
                      label={say('screens.importWizard.peopleStep.theirPin')}
                      type="password"
                      value={pins[person.id] ?? ''}
                      onValueChange={(pin) => {
                        setPins((held) => ({ ...held, [person.id]: pin }));
                      }}
                      description={say(
                        'screens.importWizard.peopleStep.withoutTheirPinTheyAreLeftOut',
                      )}
                      autoComplete="new-password"
                      {...(pinProblems[person.id] === undefined || pinProblems[person.id] === ''
                        ? {}
                        : { error: pinProblems[person.id] })}
                    />

                    <Button
                      variant="secondary"
                      disabled={!/^\d{4}$/.test(pins[person.id] ?? '')}
                      onClick={() => {
                        void giveTheirPin(person);
                      }}
                    >
                      {say('screens.importWizard.peopleStep.usePin')}
                    </Button>
                  </div>
                ) : null}

                {person.access === 'unreadable' ? (
                  <p className="pl-7 text-sm text-text-muted">
                    {say('screens.importWizard.peopleStep.plexWillNotShareTheirWatching')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </PanelCard>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="-ml-3" onClick={onBack}>
          {say('common.back')}
        </Button>

        <Button
          variant="confirm"
          size="lg"
          onClick={() => {
            onContinue({ skipUserIds: [...left], meUserId: me });
          }}
        >
          {say('common.continue')}
        </Button>
      </div>
    </div>
  );
};

PeopleStep.displayName = 'PeopleStep';

export { PeopleStep };
