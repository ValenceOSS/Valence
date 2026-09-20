import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { DialogFooterProps } from './DialogFooter.types';

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
 * the way out is quiet, the answer is white, and an answer that destroys something is red.
 *
 * The way out says Cancel where there is an answer to cancel and Close where the dialog is only
 * something to read, which is the difference the two words actually carry.
 *
 * A footer with answers that do not fit this shape — three of them, or a control that is not a
 * button — passes children instead and lays them out itself.
 *
 * The buttons share the bar as equal columns. A question with two answers should not suggest which
 * one to give by making it wider, and a bar of actions with three buttons huddled at one end reads
 * as an afterthought rather than as the thing the dialog is for.
 *
 * Equal columns is what a bar of actions wants when there is room for one. On a phone there is not:
 * three answers across 358px is 111px each, and a button will not shrink to fit — it is
 * `whitespace-nowrap` and `shrink-0` by design, so the labels run out of their cells rather than
 * wrapping inside them. Below the small breakpoint the answers stack instead, one to a line, which
 * is the one arrangement that cannot overflow however long a label is.
 *
 * A footer holding more actions than a phone can stack without filling the screen wants `ActionBar`
 * inside it rather than this: folding the lesser actions into a menu keeps the main one readable,
 * where stacking only moves the problem down the page.
 *
 * @param children - The buttons answering the dialog, where its answers are its own.
 * @param dismiss - The way out, painted quietly. Says Cancel beside an answer and Close alone.
 * @param confirm - The answer, painted white, or red where it destroys something.
 * @param note - Why the last attempt was refused, in red above the answers, when it was.
 * @param className - Extra classes for the caller's own layout.
 */
const DialogFooter = ({ children, dismiss, confirm, note, className }: DialogFooterProps) => (
  <footer
    className={cn(
      'grid shrink-0 gap-3',
      'sm:grid-flow-col sm:[grid-auto-columns:1fr]',
      'border-t border-[var(--surface-line)] bg-[var(--color-surface)] p-4',
      '[&>*]:w-full',
      className,
    )}
  >
    {note === undefined || note === null || note === '' ? null : (
      <span
        role="alert"
        className="self-center text-sm text-danger sm:[grid-column:1/-1] sm:justify-self-start"
      >
        {note}
      </span>
    )}

    {dismiss === undefined ? null : (
      <Button
        variant="secondary"
        disabled={dismiss.isDisabled ?? false}
        isLoading={dismiss.isLoading ?? false}
        onClick={dismiss.onChoose}
      >
        {dismiss.label ?? (confirm === undefined ? 'Close' : 'Cancel')}
      </Button>
    )}

    {children}

    {confirm === undefined ? null : (
      <Button
        variant={confirm.isDestructive === true ? 'danger' : 'glossy'}
        disabled={confirm.isDisabled ?? false}
        isLoading={confirm.isLoading ?? false}
        onClick={confirm.onChoose}
      >
        {confirm.label}
      </Button>
    )}
  </footer>
);

DialogFooter.displayName = 'DialogFooter';

export { DialogFooter };
