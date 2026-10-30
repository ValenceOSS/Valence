import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';
import { AmbientLight } from './components/AmbientLight/AmbientLight';
import { RoomLayer } from './components/RoomLayer/RoomLayer';
import { TvScreen } from './components/TvScreen/TvScreen';
import { useAmbientColour } from './useAmbientColour';
import type { TvSceneProps } from './TvScene.types';

/**
 * A living room at night with Valence on the television, built up in layers: the room, the light
 * the screen throws onto the wall, cabinet and floor in the colours it is showing, and the screen
 * itself, which fades from one picture to the next. On a phone the room is cropped in round the
 * television so the screen stays large.
 *
 * @param slides - The pictures the screen can show, which must come from this site.
 * @param active - Which of them is showing.
 * @param className - Where the caller places it.
 */
const TvScene = ({ slides, active, className }: TvSceneProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [loaded, setLoaded] = useState<ReadonlyMap<number, HTMLImageElement>>(new Map());
  const colours = useAmbientColour(loaded.get(active) ?? null);

  return (
    <div
      className={cn(
        'relative isolate aspect-[4/3] overflow-hidden bg-aurora sm:aspect-[1672/941]',
        className,
      )}
    >
      <div className="absolute left-1/2 top-1/2 aspect-[1672/941] w-[190%] -translate-x-[49.65%] -translate-y-[44.8%] sm:inset-0 sm:w-full sm:translate-x-0 sm:translate-y-0">
        <RoomLayer />
        <AmbientLight colours={colours} />
        <TvScreen>
          {slides.map((slide, at) => {
            const isShown = at === active;

            return (
              <motion.img
                key={slide.src}
                src={slide.src}
                srcSet={webpSourcesOf(slide.src, [800, 1600, 2400])}
                sizes="(min-width: 640px) 40vw, 90vw"
                width={2400}
                height={1350}
                alt={slide.alt}
                aria-hidden={!isShown}
                loading={at === 0 ? 'eager' : 'lazy'}
                draggable={false}
                onLoad={(event) => {
                  const image = event.currentTarget;

                  setLoaded((now) => new Map(now).set(at, image));
                }}
                initial={false}
                animate={{ opacity: isShown ? 1 : 0 }}
                transition={{ duration: isStill ? 0 : 0.7, ease: 'easeInOut' }}
                className="absolute inset-0 block h-full w-full select-none object-cover object-top brightness-[0.94]"
              />
            );
          })}
        </TvScreen>
      </div>
    </div>
  );
};

TvScene.displayName = 'TvScene';

export { TvScene };
