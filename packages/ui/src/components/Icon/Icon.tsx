import { cn } from '@ValenceUI/cn';
import type { IconProps, IconTone } from './Icon.types';

const TONES: Readonly<Record<IconTone, string>> = {
  inherit: '',
  strong: 'text-text',
  muted: 'text-text-muted',
  faint: 'text-text-muted/60',
  danger: 'text-danger',
  scrim: 'text-on-scrim',
};

const BASE_TEXT_PX = 16;

/**
 * Every glyph in Valence, drawn from one set through one component.
 *
 * A caller names the icon it wants and this decides how it is drawn. That indirection is the point,
 * and it has earned itself more than once: the set behind this has changed, and every place that
 * draws an icon changed nothing but the name it asked for.
 *
 * Whether a thing is on is said with a filled drawing, not a heavier line: `whenActive` names the
 * filled twin, or the other idea where the pair is two ideas rather than one switched on — play and
 * pause — and it is swapped in place rather than drawn beside.
 *
 * @param of - The icon.
 * @param whenActive - The drawing to show instead while in force.
 * @param isActive - Whether the thing it stands for is on.
 * @param size - How large it is, in pixels at the base text size. It is drawn in rem, so it grows
 *   with the text on a large screen rather than staying the size it was drawn for a small one.
 * @param tone - The colour it is drawn in, where it is not the colour of the text around it.
 * @param className - Extra classes for the caller's own layout.
 * @param label - What it means, where nothing beside it says; without one it is hidden from
 *   assistive technology, since the words beside it already say it.
 */
const Icon = ({
  of: Resting,
  whenActive: InForce,
  isActive = false,
  size = 18,
  tone = 'inherit',
  className,
  label,
}: IconProps) => {
  const Glyph = isActive && InForce !== undefined ? InForce : Resting;

  return (
    <Glyph
      size={`${(size / BASE_TEXT_PX).toString()}rem`}
      className={cn('valence-icon', TONES[tone], className)}
      {...(label === undefined
        ? { 'aria-hidden': true }
        : { 'aria-hidden': false, role: 'img', 'aria-label': label })}
    />
  );
};

Icon.displayName = 'Icon';

export { Icon };
