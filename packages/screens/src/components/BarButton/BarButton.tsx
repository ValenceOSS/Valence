import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { AnimatedIcon } from '@ValenceUI/AnimatedIcon';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { settleTween } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import type { BarButtonProps } from './BarButton.types';

const SWELL = [1, 1.25, 1];

/**
 * One of the round controls along the music bar. Its icon answers a pointer with the movement the
 * dock's icons make, and swells once as it lights, so turning something on — liking a song,
 * shuffling — is seen to happen rather than simply being the case the next time somebody looks.
 *
 * @param label - What pressing it does, which is also its tooltip.
 * @param litGlyph - The filled drawing to show while it is lit.
 * @param glyph - The icon.
 * @param face - Instead of a glyph, a drawing that animates itself, such as the heart that pops as a
 *   song is liked; it is left to move on its own rather than swelled as well.
 * @param badge - A small mark at the icon's corner, for a setting with more than on and off, which
 *   springs in with a turn as that setting comes on and shrinks away as it goes.
 * @param gesture - How the icon moves when pointed at.
 * @param iconSize - How large the icon is.
 * @param isLit - Whether the thing it stands for is on, which colours it and swells it as it comes on.
 * @param isDisabled - Whether it can be pressed at all.
 * @param className - Extra classes for the caller's own layout.
 * @param onClick - Told it was pressed.
 */
const BarButton = ({
  label,
  glyph,
  litGlyph,
  face,
  badge,
  gesture = 'settle',
  iconSize = 18,
  isLit = false,
  isDisabled = false,
  className,
  onClick,
}: BarButtonProps) => {
  const [isPointedAt, setPointedAt] = useState(false);
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      isActive={isLit}
      label={label}
      disabled={isDisabled}
      className={cn(isLit ? 'text-text' : 'text-text-muted hover:text-text', className)}
      onPointerEnter={() => {
        setPointedAt(true);
      }}
      onPointerLeave={() => {
        setPointedAt(false);
      }}
      onClick={onClick}
    >
      <motion.span
        initial={false}
        animate={{
          scale: isLit && face === undefined && prefersReducedMotion !== true ? SWELL : 1,
        }}
        transition={settleTween}
        className="relative flex"
      >
        <AnimatedIcon
          gesture={gesture}
          isPlaying={isPointedAt && !isDisabled}
          icon={
            glyph === undefined ? (
              face
            ) : (
              <Icon
                of={glyph}
                {...(litGlyph === undefined ? {} : { whenActive: litGlyph })}
                size={iconSize}
                isActive={isLit}
              />
            )
          }
        />
        <AnimatePresence initial={false}>
          {badge === undefined ? null : (
            <motion.span
              key="badge"
              className="absolute -top-1.5 -right-1.5 flex text-current"
              initial={prefersReducedMotion === true ? { opacity: 0 } : { scale: 0, rotate: -120 }}
              animate={prefersReducedMotion === true ? { opacity: 1 } : { scale: 1, rotate: 0 }}
              exit={prefersReducedMotion === true ? { opacity: 0 } : { scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 520, damping: 17 }}
            >
              <Icon of={badge} size={Math.round(iconSize / 2)} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </Button>
  );
};

BarButton.displayName = 'BarButton';

export { BarButton };
