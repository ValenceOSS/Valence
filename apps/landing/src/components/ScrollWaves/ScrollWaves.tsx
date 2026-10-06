import { motion, useScroll, useTransform } from 'motion/react';
import wave from '@ValenceDoodles/wave.svg';
import { cn } from '@ValenceUI/cn';

const SIDES = ['left-0', 'right-0'] as const;

const LAYERS = `url("${wave}"), linear-gradient(black, black)`;

const SIZES = '1rem 0.5rem, 100% calc(100% - 0.5rem + 1px)';

const AT = '0 0, 0 100%';

/**
 * Water rising up each side of the window as far as the page has been read, its surface a wave
 * rolling along, so how much is left is seen at the edge without a bar. Whoever asked for stillness
 * sees the surface hold still at its level.
 */
const ScrollWaves = () => {
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, (read) => `calc(${read * 100}% + 0.5rem)`);

  return SIDES.map((side) => (
    <span
      key={side}
      aria-hidden
      className={cn('pointer-events-none fixed bottom-0 z-20 hidden h-svh w-4 md:block', side)}
    >
      <motion.span
        style={{
          height,
          maskImage: LAYERS,
          WebkitMaskImage: LAYERS,
          maskRepeat: 'repeat-x, no-repeat',
          WebkitMaskRepeat: 'repeat-x, no-repeat',
          maskSize: SIZES,
          WebkitMaskSize: SIZES,
          maskPosition: AT,
          WebkitMaskPosition: AT,
        }}
        className="valence-wave-run absolute inset-x-0 bottom-0 bg-accent/60"
      />
    </span>
  ));
};

ScrollWaves.displayName = 'ScrollWaves';

export { ScrollWaves };
