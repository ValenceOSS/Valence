import { useEffect, useRef } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { useAnimate, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { SwitchProps } from './Switch.types';

const STRETCH = 1.3;

const STRETCHING = { duration: 0.32, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * One setting that is either on or off, and takes effect the moment it is pressed rather than
 * waiting for a form to be submitted. The label is part of the control rather than beside it, so
 * the words are a press target too. The knob stretches as it goes, its trailing side a moment
 * behind, and settles once it arrives — the same give the slider's handle has when dragged.
 *
 * @param label - What the setting is.
 * @param isLabelHidden - Whether to draw only the switch, for a row that already says what it is.
 * @param isOn - Whether it is on now.
 * @param onToggle - Told that it was pressed; the caller decides what the new state is.
 * @param icon - Something to draw beside the label.
 * @param disabled - Whether it can be changed at all.
 * @param tone - Whether it sits on the page or over artwork, where the page's colours say nothing.
 * @param describedBy - The id of text elsewhere that explains this setting, such as a note a caller
 *   draws beside a hidden label.
 * @param className - Extra classes for the caller's own layout.
 */
const Switch = ({
  label,
  isLabelHidden = false,
  isOn,
  onToggle,
  icon,
  disabled = false,
  tone = 'default',
  describedBy,
  className,
}: SwitchProps) => {
  const isOverlay = tone === 'overlay';
  const [knob, animate] = useAnimate<HTMLSpanElement>();
  const prefersReducedMotion = useReducedMotionConfig();
  const wasOnRef = useRef(isOn);

  useEffect(() => {
    if (wasOnRef.current === isOn) {
      return;
    }

    wasOnRef.current = isOn;

    if (prefersReducedMotion === true) {
      return;
    }

    knob.current.style.transformOrigin = isOn ? 'right center' : 'left center';
    void animate(knob.current, { scaleX: [1, STRETCH, 1] }, STRETCHING);
  }, [isOn, prefersReducedMotion, animate, knob]);

  return (
    <RadixSwitch.Root
      checked={isOn}
      disabled={disabled}
      onCheckedChange={onToggle}
      data-slot="switch"
      {...(isLabelHidden ? { 'aria-label': label } : {})}
      {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
      className={cn(
        isLabelHidden
          ? 'flex items-center outline-none'
          : 'flex w-full items-center gap-3 text-left outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring rounded-md',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {icon === undefined ? null : (
        <span className={cn('shrink-0', isOverlay ? 'text-on-scrim/80' : 'text-text-muted')}>
          {icon}
        </span>
      )}

      {isLabelHidden ? null : <span className="flex-1 truncate">{label}</span>}

      <span
        className={cn(
          'flex h-[26px] w-14 shrink-0 items-center rounded-pill border border-[var(--surface-line)] p-[2px]',
          'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]',
          'motion-reduce:transition-none',
          isOn
            ? isOverlay
              ? 'bg-on-scrim'
              : 'bg-text'
            : isOverlay
              ? 'bg-on-scrim/25'
              : 'bg-text-muted/25',
        )}
      >
        <RadixSwitch.Thumb
          ref={knob}
          className={cn(
            'h-5 w-8 shrink-0 rounded-pill shadow-sm',
            'transition-[translate] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
            'motion-reduce:transition-none',
            isOn ? 'translate-x-[18px]' : 'translate-x-0',
            isOn
              ? isOverlay
                ? 'bg-shade'
                : 'bg-[color-mix(in_oklab,var(--color-text)_10%,var(--card-face))]'
              : 'bg-on-scrim',
          )}
        />
      </span>
    </RadixSwitch.Root>
  );
};

Switch.displayName = 'Switch';

export { Switch };
