import { cn } from '@ValenceUI/cn';
import type { KbdProps } from './Kbd.types';

const TONES = {
  field: 'border border-[var(--surface-line)] bg-[var(--surface-active)] text-text-muted',
  inverse: 'bg-surface/15',
} as const;

/**
 * The keys of a shortcut, each as a small key cap: in a tooltip, or at the end of a field that the
 * shortcut opens.
 *
 * @param keys - The keys, in the order they are held.
 * @param tone - Whether it sits on a field, or in a tooltip's inverted colours.
 * @param size - How large the caps are: small inside a field, the usual size elsewhere.
 * @param className - Extra classes for the caller's own layout.
 */
const Kbd = ({ keys, tone = 'field', size = 'md', className }: KbdProps) => (
  <span className={cn('flex shrink-0', size === 'sm' ? 'gap-0.5' : 'gap-1', className)}>
    {keys.map((key) => (
      <kbd
        key={key}
        className={cn(
          'rounded-[0.3rem] text-center font-body',
          size === 'sm'
            ? 'min-w-4 px-1 text-[0.625rem] leading-4'
            : 'min-w-5 px-1.5 py-0.5 text-[0.6875rem] leading-4',
          TONES[tone],
        )}
      >
        {key}
      </kbd>
    ))}
  </span>
);

Kbd.displayName = 'Kbd';

export { Kbd };
