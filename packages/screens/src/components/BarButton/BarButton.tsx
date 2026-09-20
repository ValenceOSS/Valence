import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
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
        animate={{ scale: isLit && prefersReducedMotion !== true ? SWELL : 1 }}
        transition={settleTween}
        className="flex"
      >
        <AnimatedIcon
          gesture={gesture}
          isPlaying={isPointedAt && !isDisabled}
          icon={
            <Icon
              of={glyph}
              {...(litGlyph === undefined ? {} : { whenActive: litGlyph })}
              size={iconSize}
              isActive={isLit}
            />
          }
        />
      </motion.span>
    </Button>
  );
};

BarButton.displayName = 'BarButton';

export { BarButton };
