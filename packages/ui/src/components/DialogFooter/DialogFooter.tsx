import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { DialogFooterProps } from './DialogFooter.types';
import { say } from '@ValenceI18n/say';

/**
 * The foot of a dialog, holding the buttons that answer it. Pinned rather than scrolled, so the way
 * out of a dialog is always visible however long its content runs. Tinted the same shade as the
 * head, a step from the panel behind it, so the two read as the frame around the content rather than
 * more of it.
 *
 * A dialog says what its answers are rather than drawing them, because a footer that draws its own
 * buttons is a footer that can disagree with every other one — and they did. Cancel was painted
 * three ways across the application, and the confirming button was white here and blue there, which
 * taught nobody anything about which button does the thing. Declared instead, the rule is one rule:
 * the way out is the default gray, the answer is white, and an answer that destroys something is red.
 *
 * The way out says Cancel where there is an answer to cancel and Close where the dialog is only
 * something to read, which is the difference the two words actually carry.
 *
 * A footer with answers that do not fit this shape — three of them, or a control that is not a
 * button — passes children instead and lays them out itself.
 *
 * The buttons sit at the end of the bar at their own width, the way out before the answer, so the
 * answer is the last thing the eye reaches and the bar reads as the end of the form rather than as a
 * second form of its own. A note, where there is one, takes the room at the start.
 *
 * On a phone there is no room to sit buttons side by side: a button will not shrink to fit — it is
 * `whitespace-nowrap` and `shrink-0` by design — so below the small breakpoint the answers stack
 * instead, one to a line and full width, which is the one arrangement that cannot overflow however
 * long a label is.
 *
 * A footer holding more actions than a phone can stack without filling the screen wants `ActionBar`
 * inside it rather than this: folding the lesser actions into a menu keeps the main one readable,
 * where stacking only moves the problem down the page.
 *
 * @param children - The buttons answering the dialog, where its answers are its own.
 * @param lead - Something more to offer, such as a way to watch a trailer, set at the start of the
 *   bar apart from the answers.
 * @param dismiss - The way out, painted in the default gray. Says Cancel beside an answer and Close alone.
 * @param confirm - The answer, painted white, or red where it destroys something. Where it sends the
 *   form the footer sits in, it is that form's button and Enter presses it too.
 * @param note - Why the last attempt was refused, in red above the answers, when it was.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogFooter = ({ children, lead, dismiss, confirm, note, className }: DialogFooterProps) => {
  const confirmButton =
    confirm === undefined ? null : (
      <Button
        variant={confirm.isDestructive === true ? 'danger' : 'confirm'}
        type={confirm.isSubmit === true ? 'submit' : 'button'}
        disabled={confirm.isDisabled ?? false}
        isLoading={confirm.isLoading ?? false}
        {...(confirm.onChoose === undefined ? {} : { onClick: confirm.onChoose })}
      >
        {confirm.label}
      </Button>
    );

  return (
    <footer
      className={cn(
        'flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end',
        'border-t border-[var(--surface-line)] bg-[var(--color-surface-raised)] px-5 py-3.5',
        '[&>*]:w-full sm:[&>*]:w-auto sm:[&>button]:min-w-24 sm:[&>:not(button):only-child]:flex-1',
        className,
      )}
    >
      {note === undefined || note === null || note === '' ? null : (
        <span role="alert" className="text-sm text-danger sm:mr-auto">
          {note}
        </span>
      )}

      {lead === undefined ? null : <span className="sm:mr-auto">{lead}</span>}

      {dismiss === undefined ? null : (
        <Button
          variant="glossy"
          disabled={dismiss.isDisabled ?? false}
          isLoading={dismiss.isLoading ?? false}
          onClick={dismiss.onChoose}
        >
          {dismiss.label ?? (confirm === undefined ? say('common.close') : say('common.cancel'))}
        </Button>
      )}

      {children}

      {confirmButton}
    </footer>
  );
};

DialogFooter.displayName = 'DialogFooter';

export { DialogFooter };
