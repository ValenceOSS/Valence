import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { History, Lock, RotateCcw } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { describeTitleValue } from './describeTitleValue';
import type { SourcedFieldProps } from './SourcedField.types';
import { say } from '@ValenceI18n/say';

/**
 * One field of a title's metadata, with where its value came from: a badge beside the label says
 * where it is not the catalogue's — the file name, an edit or a lock — and an edited field says beneath it what the
 * catalogue says, with a way back to it. A menu beside the label puts it back, locks it as it
 * stands, or shows its history.
 *
 * @param label - What the field is.
 * @param state - The field's value, where it came from, and what the catalogue says.
 * @param onReset - Puts the field back to the catalogue's value.
 * @param onLock - Keeps the field as it stands through every refresh.
 * @param onUseCatalogue - Takes up a value the catalogue has changed to since the field was edited.
 * @param onShowHistory - Opens the title's history, where there is one to open.
 * @param isBusy - Whether a change to the field is being saved.
 * @param children - The control the field is edited with.
 * @param className - Extra classes for the caller's own layout.
 */
const SourcedField = ({
  label,
  state,
  onReset,
  onLock,
  onUseCatalogue,
  onShowHistory,
  isBusy = false,
  children,
  className,
}: SourcedFieldProps) => {
  const source = state?.source ?? 'catalogue';
  const isEdited = source === 'edited' || source === 'locked';
  const hasCatalogueMoved =
    isEdited &&
    (state?.catalogueChangedAt ?? null) !== null &&
    !isSameTitleValue(state?.catalogue ?? null, state?.value ?? null);

  return (
    <FormField
      label={label}
      {...(className === undefined ? {} : { className })}
      aside={
        <>
          {source === 'catalogue' ? null : (
            <Badge size="sm" tone={isEdited ? 'accent' : 'quiet'}>
              {source === 'edited'
                ? say('screens.adminArea.sourcedField.edited')
                : source === 'locked'
                  ? say('screens.adminArea.sourcedField.locked')
                  : say('screens.adminArea.titlePage.episodeTable.fileName')}
            </Badge>
          )}

          <span className="ml-auto">
            <ActionMenu
              label={say('common.moreForName', { name: label })}
              size="sm"
              align="end"
              groups={[
                {
                  items: [
                    ...(isEdited
                      ? [
                          {
                            id: 'reset',
                            label: say('screens.jobRunner.describeJobGroup.reset'),
                            icon: <Icon of={RotateCcw} size={15} />,
                            isDisabled: isBusy,
                            onChoose: onReset,
                          },
                        ]
                      : [
                          {
                            id: 'lock',
                            label: say('screens.adminArea.libraryLockRow.lock'),
                            icon: <Icon of={Lock} size={15} />,
                            isDisabled: isBusy,
                            onChoose: onLock,
                          },
                        ]),
                    ...(onShowHistory === undefined
                      ? []
                      : [
                          {
                            id: 'history',
                            label: say('common.history'),
                            icon: <Icon of={History} size={15} />,
                            onChoose: onShowHistory,
                          },
                        ]),
                  ],
                },
              ]}
            />
          </span>
        </>
      }
      {...(source !== 'edited'
        ? {}
        : {
            hint: (
              <>
                <span>
                  {hasCatalogueMoved
                    ? say('screens.adminArea.sourcedField.tmdbChangedTo', {
                        value: describeTitleValue(state?.catalogue ?? null),
                      })
                    : say('screens.adminArea.sourcedField.tmdbSays', {
                        value: describeTitleValue(state?.catalogue ?? null),
                      })}
                </span>

                <Button
                  variant="ghost"
                  size="xs"
                  disabled={isBusy}
                  onClick={hasCatalogueMoved ? onUseCatalogue : onReset}
                >
                  {hasCatalogueMoved
                    ? say('screens.adminArea.sourcedField.useThis')
                    : say('screens.jobRunner.describeJobGroup.reset')}
                </Button>
              </>
            ),
          })}
    >
      {children}
    </FormField>
  );
};

SourcedField.displayName = 'SourcedField';

export { SourcedField };
