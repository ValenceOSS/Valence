import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { describeCeiling } from '@ValenceContracts/schemas/LibraryAccess';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import type { LibraryReachListProps } from './LibraryReachList.types';
import { say } from '@ValenceI18n/say';

/**
 * Every library, with whether one account may see it and the age it is limited to there, for an
 * administrator deciding for anybody and a parent deciding for their own child.
 *
 * @param shelves - Every library, as it would be saved.
 * @param whose - The name of the account being decided for.
 * @param onChange - Told what changed about one library.
 */
const LibraryReachList = ({ shelves, whose, onChange }: LibraryReachListProps) => (
  <>
    {shelves.length === 0 ? (
      <p className="text-sm text-text-muted">{say('common.thereAreNoLibrariesYet')}</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {shelves.map((shelf) => (
          <li key={shelf.id} className="flex flex-wrap items-center gap-2">
            <Button
              variant={shelf.mayView ? 'glossy' : 'ghost'}
              size="sm"
              aria-pressed={shelf.mayView}
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
                onChange(shelf.id, { mayView: !shelf.mayView });
              }}
            >
              {shelf.name}
            </Button>

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
                      onChange(shelf.id, {
                        maximumAge: id === 'none' ? null : Number.parseInt(id, 10),
                      });
                    },
                    options: AGE_CHOICES,
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
                  onChange(shelf.id, {
                    allowsUnrated: !shelf.allowsUnrated,
                    maximumAge: shelf.maximumAge ?? 0,
                  });
                }}
              >
                {say('common.allowUnrated')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    )}

    {shelves.length === 0 || shelves.some((shelf) => shelf.mayView) ? null : (
      <p className="pt-2 text-xs text-text-muted">
        {say('screens.adminArea.accountsPanel.theyCanReachNothingAtAll')}
      </p>
    )}

    {shelves.every((shelf) => shelf.maximumAge === null) ? null : (
      <p className="pt-2 text-xs text-text-muted">
        {say('screens.adminArea.accountsPanel.aLimitAppliesToThisAccount')}
      </p>
    )}
  </>
);

LibraryReachList.displayName = 'LibraryReachList';

export { LibraryReachList };
