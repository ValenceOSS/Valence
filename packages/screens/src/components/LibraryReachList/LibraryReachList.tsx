import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { describeCeiling } from '@ValenceContracts/schemas/LibraryAccess';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import type { LibraryReachListProps } from './LibraryReachList.types';
import { say } from '@ValenceI18n/say';

/**
 * Every library, with whether somebody may see it and the age they are limited to there, for an
 * administrator deciding for an account and an owner deciding for one of its profiles.
 *
 * @param shelves - Every library, as it stands.
 * @param whose - The name of whoever is being decided for.
 * @param onChange - Told what changed about one library.
 * @param agesFor - The ages a library may be limited to, where not every age may be chosen.
 * @param changing - The library whose change is being kept, while one is.
 */
const LibraryReachList = <Shelf extends LibraryReach>({
  shelves,
  whose,
  onChange,
  agesFor = () => AGE_CHOICES,
  changing = null,
}: LibraryReachListProps<Shelf>) =>
  shelves.length === 0 ? (
    <p className="text-sm text-text-muted">{say('common.thereAreNoLibrariesYet')}</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {shelves.map((shelf) => (
        <li key={shelf.id} className="flex items-start gap-2">
          <Button
            variant={shelf.mayView ? 'glossy' : 'ghost'}
            size="sm"
            aria-pressed={shelf.mayView}
            isLoading={changing === shelf.id}
            label={
              shelf.mayView
                ? say('screens.adminArea.accountsPanel.keepNameFromName2', {
                    name: shelf.name,
                    name2: whose,
                  })
                : say('screens.adminArea.accountsPanel.letNameSeeName2', {
                    name: whose,
                    name2: shelf.name,
                  })
            }
            onClick={() => {
              onChange(shelf, { mayView: !shelf.mayView });
            }}
          >
            {shelf.name}
          </Button>

          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {!shelf.mayView ? null : (
              <OptionMenu
                label={say('screens.adminArea.accountsPanel.ageLimitInNameForName2', {
                  name: shelf.name,
                  name2: whose,
                })}
                groups={[
                  {
                    name: say('common.nothingAbove'),
                    selectedId: shelf.maximumAge === null ? 'none' : String(shelf.maximumAge),
                    onSelect: (id) => {
                      onChange(shelf, {
                        maximumAge: id === 'none' ? null : Number.parseInt(id, 10),
                      });
                    },
                    options: agesFor(shelf),
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">{describeCeiling(shelf.maximumAge)}</span>

                    <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
                  </>
                }
                triggerShape="field"
                align="end"
                className="w-40 max-w-full"
              />
            )}

            {shelf.maximumAge === null ? null : (
              <Button
                variant={shelf.allowsUnrated ? 'glossy' : 'ghost'}
                size="sm"
                aria-pressed={shelf.allowsUnrated}
                label={say('screens.adminArea.accountsPanel.allowUncertificatedThingsInNameFor', {
                  name: shelf.name,
                  name2: whose,
                })}
                onClick={() => {
                  onChange(shelf, {
                    allowsUnrated: !shelf.allowsUnrated,
                    maximumAge: shelf.maximumAge ?? 0,
                  });
                }}
              >
                {say('common.allowUnrated')}
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );

LibraryReachList.displayName = 'LibraryReachList';

export { LibraryReachList };
