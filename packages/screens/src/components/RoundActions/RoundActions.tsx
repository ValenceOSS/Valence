import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { foldedActionsOf } from '@ValenceUI/foldedActionsOf';
import { say } from '@ValenceI18n/say';
import { glassOnArtwork } from '@ValenceScreens/components/PlayWithRestart/glassOnArtwork';
import type { ReactNode } from 'react';
import type { RoundAction, RoundActionsProps } from './RoundActions.types';

const MOST_SHOWN = 5;

const WHOLE =
  'group flex h-auto w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-xl bg-transparent text-xs font-medium text-text-muted transition-colors duration-[var(--duration-fast)] hover:bg-transparent hover:text-text data-[state=open]:bg-transparent data-[state=open]:text-text';

const FACE =
  'flex size-12 items-center justify-center rounded-full bg-[var(--surface-hover)] text-text transition-colors duration-[var(--duration-fast)] group-hover:bg-[var(--surface-active)] group-data-[state=open]:bg-[var(--surface-active)]';

const COMPACT = cn(
  'flex h-[3.25rem] min-w-0 flex-1 items-center justify-center rounded-[0.875rem] md:w-[3.25rem] md:flex-none',
  glassOnArtwork,
);

/**
 * The circle and the word under it that every round action is drawn as.
 *
 * @param icon - What is drawn in the circle.
 * @param label - The word under it.
 * @param isChosen - Whether it is on, which fills the circle in.
 */
const faceOf = (icon: ReactNode, label: string, isChosen = false) => (
  <>
    <span className={cn(FACE, isChosen ? 'bg-[var(--surface-active)]' : '')}>{icon}</span>
    <span className="max-w-full truncate">{label}</span>
  </>
);

/**
 * A row of round actions under a title's play button, as the phone draws them: a circle with a
 * picture in it and a word beneath, spaced evenly across the row. Where there are more than fit,
 * the last circle is a menu holding the rest, in the same order.
 *
 * An action with choices of its own opens them from its circle.
 *
 * @param label - What the menu of the rest is, read out to anybody who cannot see it.
 * @param actions - Everything that can be done, most wanted first.
 * @param isCompact - Whether to draw each as a square alone, lit faintly over artwork beside a
 *   title's play button and shaped as it is, named by a tooltip rather than a word beneath it.
 * @param className - Extra classes for the caller's own layout.
 */
const RoundActions = ({ label, actions, isCompact = false, className }: RoundActionsProps) => {
  const isFolding = actions.length > MOST_SHOWN;
  const shown = isFolding ? actions.slice(0, MOST_SHOWN - 1) : actions;
  const folded = isFolding ? actions.slice(MOST_SHOWN - 1) : [];

  const circleFor = (action: RoundAction) =>
    isCompact && action.choices === undefined ? (
      <Button
        key={action.id}
        variant="ghost"
        size="none"
        label={action.label}
        className={COMPACT}
        isActive={action.isChosen === true}
        disabled={action.isDisabled === true}
        onClick={action.onChoose}
      >
        {action.icon}
      </Button>
    ) : action.choices === undefined ? (
      <Button
        key={action.id}
        variant="bare"
        size="none"
        className={WHOLE}
        isActive={action.isChosen === true}
        disabled={action.isDisabled === true}
        onClick={action.onChoose}
      >
        {faceOf(action.icon, action.label, action.isChosen)}
      </Button>
    ) : (
      <ActionMenu
        key={action.id}
        label={action.label}
        align="center"
        isDisabled={action.isDisabled === true}
        className={isCompact ? COMPACT : WHOLE}
        trigger={isCompact ? action.icon : faceOf(action.icon, action.label)}
        groups={[{ items: [...action.choices] }]}
      />
    );

  return (
    <div
      className={cn(
        isCompact
          ? 'flex w-full items-center gap-2 md:w-auto'
          : 'flex items-start justify-evenly gap-1',
        className,
      )}
    >
      {shown.map(circleFor)}

      {folded.length === 0 ? null : (
        <ActionMenu
          label={label}
          align="end"
          className={isCompact ? COMPACT : WHOLE}
          trigger={
            isCompact ? (
              <Icon of={MoreHorizontalIcon} size={20} />
            ) : (
              faceOf(<Icon of={MoreHorizontalIcon} size={20} />, say('common.more'))
            )
          }
          groups={foldedActionsOf(folded)}
        />
      )}
    </div>
  );
};

RoundActions.displayName = 'RoundActions';

export { RoundActions };
