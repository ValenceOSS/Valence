import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { cn } from '@ValenceUI/cn';
import type { CalloutProps, CalloutTone } from './Callout.types';

const TONE_CLASSES: Record<CalloutTone, string> = {
  quiet: 'border-line bg-subtle text-text',
  warning: 'border-highlight/40 bg-highlight/10 text-text',
  danger: 'border-danger/40 bg-danger/10 text-text',
};

const TONE_ICON_CLASSES: Record<CalloutTone, string> = {
  quiet: 'text-text-muted',
  warning: 'text-highlight',
  danger: 'text-danger',
};

const DEFAULT_ICONS: Record<CalloutTone, typeof InfoIcon> = {
  quiet: InfoIcon,
  warning: TriangleAlertIcon,
  danger: TriangleAlertIcon,
};

/**
 * Says one thing a reader has to know before they act, in the place they would act.
 *
 * For the facts that change what somebody does next rather than for anything that merely went
 * wrong: media mounted read only, not enough room to start, a choice that costs more than it saves.
 * Those were each hand-rolled as a bordered paragraph before this existed, in slightly different
 * colours, which is how a design system rots a file at a time.
 *
 * A warning is announced to assistive technology and the quiet tone is not, because the quiet one
 * is context and the other two are things somebody needs to hear about at the moment they appear.
 *
 * @param title - The fact, said in one line.
 * @param children - What follows from it, where a line is not enough.
 * @param tone - How much attention it should draw, defaulting to none.
 * @param icon - A glyph of the caller's choosing, where the tone's own is not the right one.
 * @param action - What to do about it, where there is something.
 * @param className - Extra classes for the caller's own layout.
 */
const Callout = ({ title, children, tone = 'quiet', icon, action, className }: CalloutProps) => (
  <div
    {...(tone === 'quiet' ? {} : { role: 'alert' })}
    className={cn(
      'flex items-start gap-3 rounded-lg border p-4 text-sm',
      TONE_CLASSES[tone],
      className,
    )}
  >
    <span className={cn('mt-0.5 shrink-0', TONE_ICON_CLASSES[tone])}>
      <Icon of={icon ?? DEFAULT_ICONS[tone]} size={18} />
    </span>

    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="font-medium">{title}</span>

      {children === undefined ? null : (
        <span className="font-body text-text-muted">{children}</span>
      )}
    </span>

    {action === undefined ? null : <span className="shrink-0">{action}</span>}
  </div>
);

Callout.displayName = 'Callout';

export { Callout };
