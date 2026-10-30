import { useState } from 'react';
import type { PointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotionConfig,
  useSpring,
  useTransform,
} from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';
import type { IsoPhoneProps } from './IsoPhone.types';

const SCREEN_INSET = 'absolute left-[5.4%] top-[2.3%] h-[95.4%] w-[89.7%] rounded-[13%/6%]';

const SPREAD = { stiffness: 80, damping: 16, mass: 1 } as const;

const LEAN = { stiffness: 110, damping: 20, mass: 0.6 } as const;

const MOST_LEAN_DEGREES = 6;

/**
 * The phone app drawn as a phone lying at the same isometric angle as the figures, built from
 * layers the way the phone itself is: the body, the screen showing the part of the app chosen beside
 * it, and the glass and frame on top. Pointing at it lifts the layers apart along the dashed guides
 * between them and turns it a little towards the pointer; a tap does the same on a touch screen.
 * Whoever asked for stillness sees it closed and level.
 *
 * @param screens - Each part of the app it can show, with what it shows.
 * @param active - Which of them is on the screen.
 * @param className - Its size and place, which the section decides.
 */
const IsoPhone = ({ screens, active, className }: IsoPhoneProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [isTapped, setIsTapped] = useState(false);
  const spreadTarget = useMotionValue(0);
  const spread = useSpring(spreadTarget, SPREAD);
  const leanTarget = useMotionValue(0);
  const lean = useSpring(leanTarget, LEAN);
  const rotateZ = useTransform(lean, (degrees) => -38 + degrees);
  const screenZ = useTransform(spread, [0, 1], [10, 90]);
  const glassZ = useTransform(spread, [0, 1], [20, 180]);
  const guideHeight = useTransform(spread, [0, 1], [0, 180]);
  const guideOpacity = useTransform(spread, [0, 0.2, 1], [0, 0.6, 0.6]);

  const open = (isOpen: boolean) => {
    spreadTarget.set(isStill || !isOpen ? 0 : 1);
  };

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (isStill || event.pointerType !== 'mouse') {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();

    leanTarget.set(((event.clientX - box.left) / box.width - 0.5) * 2 * MOST_LEAN_DEGREES);
  };

  return (
    <div
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          open(true);
        }
      }}
      onPointerMove={follow}
      onPointerLeave={() => {
        open(false);
        leanTarget.set(0);
      }}
      onClick={() => {
        setIsTapped((was) => !was);
        open(!isTapped);
      }}
      className={cn('relative aspect-square [perspective:2200px]', className)}
    >
      <motion.div
        style={{ rotateX: 56, rotateZ }}
        className="absolute left-1/2 top-1/2 aspect-[448/916] w-[52%] -translate-x-1/2 -translate-y-[46%] [transform-style:preserve-3d]"
      >
        <span
          aria-hidden
          className="absolute inset-[4%] rounded-[2.4rem] bg-overlay opacity-60 blur-2xl [transform:translateZ(-2px)]"
        />

        <span
          aria-hidden
          className="absolute inset-0 rounded-[2.6rem] border border-[var(--surface-line)] bg-phone-floor"
        />

        {[
          'left-[6%] top-[3%]',
          'right-[6%] top-[3%]',
          'left-[6%] bottom-[3%]',
          'right-[6%] bottom-[3%]',
        ].map((corner) => (
          <motion.span
            key={corner}
            aria-hidden
            style={{ height: guideHeight, opacity: guideOpacity }}
            className={cn(
              'absolute w-0 origin-bottom border-l border-dashed border-text-muted [transform:rotateX(-90deg)]',
              corner,
            )}
          />
        ))}

        <motion.div style={{ z: screenZ }} className={cn(SCREEN_INSET, 'overflow-hidden')}>
          {screens.map((screen, at) => (
            <img
              key={screen.src}
              src={screen.src}
              srcSet={webpSourcesOf(screen.src, [276, 552])}
              sizes="(min-width: 64rem) 20rem, 50vw"
              width={552}
              height={1200}
              alt={screen.alt}
              aria-hidden={at !== active}
              loading="lazy"
              draggable={false}
              className={cn(
                'absolute inset-0 h-full w-full select-none object-cover object-top',
                !isStill && 'transition-opacity duration-700',
                at === active ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
        </motion.div>

        <motion.img
          src="/devices/iphone-blue.png"
          srcSet={webpSourcesOf('/devices/iphone-blue.png', [224, 448])}
          sizes="(min-width: 64rem) 20rem, 50vw"
          width={448}
          height={916}
          alt=""
          aria-hidden
          loading="lazy"
          draggable={false}
          style={{ z: glassZ }}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />
      </motion.div>
    </div>
  );
};

IsoPhone.displayName = 'IsoPhone';

export { IsoPhone };
