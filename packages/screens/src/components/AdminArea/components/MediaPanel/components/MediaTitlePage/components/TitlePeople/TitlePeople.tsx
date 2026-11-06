import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User as UserIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { findCataloguePeople } from '@ValenceClient/admin/findCataloguePeople';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { SourcedField } from '@ValenceScreens/components/AdminArea/components/SourcedField/SourcedField';
import { useTitleChange } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/useTitleChange';
import { CastRow } from './components/CastRow/CastRow';
import { castOfValue } from './castOfValue';
import type { CastEntry, TitleEditRequest } from '@ValenceContracts/schemas/TitleEdit';
import type { TitlePeopleProps } from './TitlePeople.types';
import { say } from '@ValenceI18n/say';

const TYPING_SETTLES_MS = 400;

/**
 * A title's People tab: its cast in billing order, each person's part editable, moved up or down or
 * taken off, and anybody added from the catalogue by name or by name alone. Every change is saved at
 * once, and the cast says where it came from and goes back to the catalogue's in one press.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, or one of its episodes.
 * @param field - Whose people: the title's cast, or an episode's guest stars.
 * @param onShowHistory - Opens the title's history.
 */
const TitlePeople = ({
  mediaId,
  scope = 'title',
  field = 'cast',
  onShowHistory,
}: TitlePeopleProps) => {
  const metadata = useQuery(adminQueries.titleMetadata(mediaId, scope));
  const { change } = useTitleChange(mediaId, scope);
  const [typed, setTyped] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const looking = useSettled(typed.trim(), TYPING_SETTLES_MS);
  const found = useQuery({
    queryKey: ['catalogue-people', looking],
    queryFn: () => findCataloguePeople(looking),
    enabled: looking.length >= 2,
    staleTime: 60_000,
  });

  if (metadata.isPending) {
    return <Spinner isCentered size="sm" label={say('common.loading')} />;
  }

  if (metadata.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.titleDetails.theDetailsCouldNotBeRead')}
        why={metadata.error.message}
        onTryAgain={() => {
          void metadata.refetch();
        }}
        isTryingAgain={metadata.isFetching}
      />
    );
  }

  const state = metadata.data.fields[field];
  const cast = castOfValue(state?.value);

  const act = (request: TitleEditRequest) => {
    setIsBusy(true);

    void change(request).then((outcome) => {
      setIsBusy(false);

      if (!outcome.isSaved) {
        notify.failed(outcome.reason);
      }
    });
  };

  const save = (next: CastEntry[]) => {
    act({ set: { [field]: next } });
  };

  const add = (member: CastEntry) => {
    setTyped('');
    save([
      ...cast.filter((one) => member.personId === null || one.personId !== member.personId),
      member,
    ]);
  };

  const swap = (at: number, to: number) => {
    const next = [...cast];
    const [moved] = next.splice(at, 1);

    if (moved !== undefined) {
      next.splice(to, 0, moved);
      save(next);
    }
  };

  const people = found.data ?? [];

  return (
    <div className="@container min-w-0">
      <PanelCard title={say('common.people')}>
        <SourcedField
          label={field === 'cast' ? say('common.cast') : labelOfField(field, 'episode')}
          state={state}
          isBusy={isBusy}
          {...(onShowHistory === undefined ? {} : { onShowHistory })}
          onReset={() => {
            act({ reset: [field] });
          }}
          onLock={() => {
            act({ lock: [field] });
          }}
          onUseCatalogue={() => {
            act({ set: { [field]: castOfValue(state?.catalogue ?? null) } });
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <TextField
                label={say('screens.adminArea.titlePeople.addAPerson')}
                value={typed}
                onValueChange={setTyped}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setTyped('');
                  }
                }}
              />
              {looking.length < 2 ? null : (
                <ul className="flex flex-col divide-y divide-line rounded-lg ring-1 ring-line">
                  {found.isFetching && people.length === 0 ? (
                    <li className="p-3">
                      <Spinner
                        size="sm"
                        label={say('screens.adminArea.titlePeople.lookingInTheCatalogue')}
                      />
                    </li>
                  ) : null}
                  {!found.isFetching && people.length === 0 ? (
                    <li className="p-3 font-body text-sm text-text-muted">
                      {say('screens.adminArea.titlePeople.noOneInTheCatalogue')}
                    </li>
                  ) : null}
                  {people.map((person) => (
                    <li key={person.personId} className="flex items-center gap-3 p-2">
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-text-muted">
                        {person.imageUrl === null ? (
                          <Icon of={UserIcon} size={16} />
                        ) : (
                          <img
                            src={person.imageUrl}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-body text-sm text-text">{person.name}</span>
                        {person.knownFor === null ? null : (
                          <span className="truncate font-body text-xs text-text-muted">
                            {say('screens.adminArea.titlePeople.knownForWorks', {
                              works: person.knownFor,
                            })}
                          </span>
                        )}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        label={say('screens.adminArea.titlePeople.addName', { name: person.name })}
                        onClick={() => {
                          add({
                            personId: person.personId,
                            name: person.name,
                            role: '',
                            imageUrl: person.imageUrl,
                          });
                        }}
                      >
                        {say('common.add')}
                      </Button>
                    </li>
                  ))}
                  <li className="flex flex-wrap items-center justify-between gap-2 p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        add({ personId: null, name: looking, role: '', imageUrl: null });
                      }}
                    >
                      {say('screens.adminArea.titlePeople.addNameByNameOnly', { name: looking })}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTyped('');
                      }}
                    >
                      {say('common.cancel')}
                    </Button>
                  </li>
                </ul>
              )}
            </div>

            {cast.length === 0 ? (
              <p className="font-body text-sm text-text-muted">
                {say('screens.adminArea.titlePeople.nobodyIsInTheCast')}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="font-body text-xs text-text-muted">
                  {say('screens.adminArea.titlePeople.castOrderSaysWhoIsBilledFirst')}
                </p>
                <ul className="flex flex-col divide-y divide-line">
                  {cast.map((member, at) => (
                    <CastRow
                      key={`${member.personId?.toString() ?? member.name}-${at.toString()}`}
                      member={member}
                      onRole={(role) => {
                        save(cast.map((one, other) => (other === at ? { ...one, role } : one)));
                      }}
                      {...(at === 0
                        ? {}
                        : {
                            onMoveToTop: () => {
                              swap(at, 0);
                            },
                          })}
                      {...(at === 0
                        ? {}
                        : {
                            onMoveUp: () => {
                              swap(at, at - 1);
                            },
                          })}
                      {...(at === cast.length - 1
                        ? {}
                        : {
                            onMoveDown: () => {
                              swap(at, at + 1);
                            },
                          })}
                      onRemove={() => {
                        save(cast.filter((_, other) => other !== at));
                      }}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SourcedField>
      </PanelCard>
    </div>
  );
};

TitlePeople.displayName = 'TitlePeople';

export { TitlePeople };
