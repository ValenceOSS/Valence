import { motion, useReducedMotionConfig } from 'motion/react';
import type { AmbientLightProps } from './AmbientLight.types';

const DARK = 'transparent';

const BLEND_SECONDS = 1.2;

const STRENGTH = 0.5;

/**
 * The light the television throws into the room: a glow in the colours on its screen, on the wall
 * behind it, along the top of the cabinet and a little onto the floor, kept off the lamp, the
 * shelves and the furniture in front. It drifts into new colours as the screen changes, or takes
 * them at once for whoever asked for stillness, and stays dark until it has colours to show.
 *
 * @param colours - The screen's colours, strongest first, as `#rrggbb`.
 */
const AmbientLight = ({ colours }: AmbientLightProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [strongest = DARK, next = strongest, third = next] = colours;

  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{
        opacity: colours.length > 0 ? STRENGTH : 0,
        '--ambient-a': strongest,
        '--ambient-b': next,
        '--ambient-c': third,
      }}
      transition={{ duration: isStill ? 0 : BLEND_SECONDS, ease: 'easeInOut' }}
      className={[
        'pointer-events-none absolute inset-0 mix-blend-screen',
        '[mask-image:url(/hero/living-room-light.webp)] [mask-size:100%_100%]',
        'bg-[radial-gradient(ellipse_34%_44%_at_49.7%_44.8%,var(--ambient-a)_0%,var(--ambient-a)_45%,transparent_100%),radial-gradient(ellipse_30%_38%_at_33%_42%,var(--ambient-b),transparent_80%),radial-gradient(ellipse_30%_38%_at_66%_42%,var(--ambient-c),transparent_80%),radial-gradient(ellipse_38%_14%_at_50%_70%,var(--ambient-a),transparent_85%)]',
      ].join(' ')}
    />
  );
};

AmbientLight.displayName = 'AmbientLight';

export { AmbientLight };
