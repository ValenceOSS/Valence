import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { useMusicLights } from '@ValenceScreens/music/musicLights';

const LIGHTS_USED = 3;

const WASHING = { duration: 0.7, ease: [0.23, 1, 0.32, 1] } as const;

/**
 * The glow across the top of the music page, in the colours of whatever it is showing — an
 * album's cover, an artist's picture, the song playing.
 *
 * It is light rather than a filled band: the brightest few colours read from the picture, each
 * spread from where it sat in the picture and fading out down the page, so the header stands in
 * the colour of its artwork. A new page's light dissolves in over the last one's rather than
 * switching, and a page with no picture simply lets the light go out.
 */
const MusicWash = () => {
  const lights = useMusicLights();
  const prefersReducedMotion = useReducedMotionConfig();
  const shown = lights.slice(0, LIGHTS_USED);

  const painted = shown
    .map(
      (light, at) =>
        `radial-gradient(80% 120% at ${light.at ?? `${(20 + at * 30).toString()}% 0%`}, color-mix(in oklab, ${light.color} 55%, transparent), transparent 70%)`,
    )
    .join(', ');

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] [mask-image:linear-gradient(to_bottom,black,transparent)]"
    >
      <AnimatePresence initial={false}>
        {painted === '' ? null : (
          <motion.div
            key={painted}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion === true ? { duration: 0 } : WASHING}
            className="absolute inset-0"
            style={{ backgroundImage: painted }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

MusicWash.displayName = 'MusicWash';

export { MusicWash };
