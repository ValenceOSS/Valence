import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { History, Lock, RotateCcw, Unlock } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { describeTitleValue } from './describeTitleValue';
import type { SourcedFieldProps } from './SourcedField.types';
import { say } from '@ValenceI18n/say';

/**
 * One field of a title's metadata, with where its value came from: beside the label, a badge says
 * where it is the file name's or an edit, and a lock where it is locked, and an edited field says beneath it what the
 * catalogue says, with a way back to it. A menu beside the label, there whenever the pointer or
 * the focus is on the field and always on a touch screen, puts it back, locks it as it stands, or
 * shows its history.
 *
 * @param label - What the field is.
 * @param isLabelHidden - Whether the label is only read out, for a field whose section is named for it.
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
  isLabelHidden = false,
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

  const badge = (
    <>
      {source === 'catalogue' ? null : source === 'locked' ? (
        <Icon
          of={Lock}
          size={14}
          tone="muted"
          label={say('screens.adminArea.sourcedField.locked')}
        />
      ) : (
        <Badge size="sm" tone={isEdited ? 'accent' : 'quiet'}>
          {source === 'edited'
            ? say('screens.adminArea.sourcedField.edited')
            : say('screens.adminArea.titlePage.episodeTable.fileName')}
        </Badge>
      )}

      <span className="ml-auto opacity-0 transition-opacity duration-[var(--duration-fast)] group-focus-within/field:opacity-100 group-hover/field:opacity-100 has-[[data-state=open]]:opacity-100 coarse:opacity-100 motion-reduce:transition-none">
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
                        label:
                          source === 'locked'
                            ? say('screens.adminArea.sourcedField.unlockTheField')
                            : say('screens.jobRunner.describeJobGroup.reset'),
                        icon: <Icon of={source === 'locked' ? Unlock : RotateCcw} size={15} />,
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
  );
  const hint =
    source !== 'edited' ? null : (
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
    );

  return (
    <FormField
      label={label}
      isLabelHidden={isLabelHidden}
      className={cn('group/field', className)}
      aside={badge}
      {...(hint === null ? {} : { hint })}
    >
      {children}
    </FormField>
  );
};

SourcedField.displayName = 'SourcedField';

export { SourcedField };
