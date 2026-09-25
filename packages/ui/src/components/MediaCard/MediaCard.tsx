import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { Badge } from '@ValenceUI/Badge';
import { Check as CheckIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Tooltip } from '@ValenceUI/Tooltip';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { say } from '@ValenceI18n/say';
import type { MediaCardProps, MediaCardShape } from './MediaCard.types';

const SHAPE_CLASSES: Record<MediaCardShape, string> = {
  poster: 'aspect-[2/3]',
  wide: 'aspect-video',
};

/**
 * One thing in a library, drawn as artwork with its name beneath. Carries how far through it
 * somebody is as a bar across the foot, and takes its shape from what it holds — a poster stands
 * upright, a still lies flat. The whole card is the press target rather than the title alone.
 *
 * @param title - What the thing is called.
 * @param eyebrow - A line above the title, such as which episode this is.
 * @param subtitle - A line beneath it, such as the year or the length.
 * @param badges - Short facts to show over the artwork, such as the format.
 * @param corner - A mark in the top right corner of the artwork, for one fact that is better shown as an
 *   icon than said, such as that it is already in the library.
 * @param count - A number to show in the top right corner of the artwork, such as how many episodes
 *   are left to watch; nothing is drawn for none.
 * @param countLabel - What the number means, read out and shown on hover.
 * @param imageUrl - The artwork, where any has been fetched.
 * @param shape - Whether the artwork stands upright or lies flat.
 * @param emphasis - How much the card should draw the eye.
 * @param watchedFraction - How far through it this viewer is, drawn as a bar, and as a tick in the
 *   corner once it is all of it.
 * @param onSelect - Told when the card was pressed.
 * @param isStill - Whether to hold the card still rather than letting it lift under a pointer.
 * @param className - Extra classes for the caller's own layout.
 */
const MediaCard = ({
  title,
  eyebrow,
  subtitle,
  badges = [],
  corner,
  count,
  countLabel,
  imageUrl,
  shape = 'poster',
  emphasis = 'standard',
  watchedFraction,
  onSelect,
  isStill = false,
  className,
}: MediaCardProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isLead = emphasis === 'lead';
  const [canHover] = useState(hasFinePointer);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      {...(prefersReducedMotion === true || isStill
        ? {}
        : {
            ...(canHover ? { whileHover: { y: -6 } } : {}),
            whileTap: { scale: 0.985 },
          })}
      transition={revealTransition(prefersReducedMotion)}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-md text-left outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring',
        className,
      )}
    >
      <span
        className={cn(
          'relative block overflow-hidden rounded-md bg-card',
          'shadow-[var(--shadow-artwork)] ring-1 ring-line',
          'transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out)]',
          'motion-reduce:transition-none hover-hover:group-hover:shadow-[var(--shadow-artwork-raised)]',
          SHAPE_CLASSES[shape],
        )}
      >
        {imageUrl === undefined ? (
          <span
            aria-hidden
            className="absolute bottom-[-0.15em] left-[-0.06em] text-[9rem] font-semibold leading-none tracking-tighter text-on-scrim/[0.07]"
          >
            {title.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none hover-hover:group-hover:scale-[1.04]"
          />
        )}

        <span className="absolute inset-0 bg-linear-to-t from-shade/80 via-shade/10 to-transparent opacity-70 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none hover-hover:group-hover:opacity-90" />

        {badges.length === 0 ? null : (
          <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <Badge key={badge} tone="solid">
                {badge}
              </Badge>
            ))}
          </span>
        )}

        {count === undefined || count <= 0 || corner !== undefined ? null : (
          <span className="absolute right-3 top-3">
            <Tooltip label={countLabel ?? count.toString()}>
              <span
                role="img"
                aria-label={countLabel ?? count.toString()}
                className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold tabular-nums text-primary-foreground shadow-sm"
              >
                {count > 99 ? '99+' : count.toString()}
              </span>
            </Tooltip>
          </span>
        )}

        {corner === undefined ? null : (
          <span className="absolute right-3 top-3">
            <Tooltip label={corner.label}>
              <span
                role="img"
                aria-label={corner.label}
                className="flex size-7 items-center justify-center rounded-full bg-success text-surface"
              >
                <Icon of={corner.icon} size={16} />
              </span>
            </Tooltip>
          </span>
        )}

        {watchedFraction === undefined || watchedFraction < 1 ? null : (
          <span className="absolute bottom-3 right-3">
            <Tooltip label={say('ui.mediaCard.watched')}>
              <span
                role="img"
                aria-label={say('ui.mediaCard.watched')}
                className="flex size-6 items-center justify-center rounded-full bg-scrim"
              >
                <Icon of={CheckIcon} size={14} tone="scrim" />
              </span>
            </Tooltip>
          </span>
        )}

        {watchedFraction === undefined || watchedFraction >= 1 ? null : (
          <span className="absolute inset-x-3 bottom-2.5 mx-2 mb-1 h-1 overflow-hidden rounded-full bg-on-scrim/25">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(Math.min(Math.max(watchedFraction, 0), 1) * 100).toString()}%` }}
            />
          </span>
        )}

        {isLead ? (
          <span className="absolute inset-x-4 bottom-4 flex flex-col gap-1">
            {eyebrow === undefined ? null : (
              <span className="text-[0.65rem] uppercase tracking-[0.18em] text-on-scrim/60">
                {eyebrow}
              </span>
            )}

            <span className="text-2xl font-semibold leading-tight tracking-tight text-on-scrim sm:text-3xl">
              {title}
            </span>
            <span className="font-body text-xs text-on-scrim/70">{subtitle}</span>
          </span>
        ) : null}
      </span>

      {isLead ? null : (
        <span className="flex flex-col gap-0.5 px-0.5">
          {eyebrow === undefined ? null : (
            <span className="line-clamp-1 text-[0.65rem] uppercase tracking-[0.16em] text-text-muted">
              {eyebrow}
            </span>
          )}

          <span className="line-clamp-1 text-sm font-medium text-text">{title}</span>
          <span className="line-clamp-1 font-body text-xs text-text-muted">{subtitle}</span>
        </span>
      )}
    </motion.button>
  );
};

MediaCard.displayName = 'MediaCard';

export { MediaCard };
