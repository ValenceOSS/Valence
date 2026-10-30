import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Language as LanguageIcon } from '@keyline-icons/react/duotone';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { ByTheWay } from '@ValenceLanding/components/HomePage/components/ByTheWay/ByTheWay';
import { useStepCycle } from '@ValenceLanding/components/HomePage/useStepCycle';
import { IsoPhone } from './components/IsoPhone/IsoPhone';
import { POCKET_FEATURES } from './POCKET_FEATURES';

const STAYS_MS = 5000;

/**
 * The phone app: what it does, as a short list beside a phone lying at the figures' isometric angle,
 * whose screen shows whichever part of the app is chosen. The list walks through itself on its own
 * and holds while it is pointed at or a choice in it has the keyboard; choosing one shows it at once.
 * Whoever asked for stillness sees the first chosen and nothing moving.
 */
const PocketSection = () => {
  const isStill = useReducedMotionConfig() === true;
  const [isHeld, setIsHeld] = useState(false);
  const { active, progress, select } = useStepCycle(
    POCKET_FEATURES.length,
    STAYS_MS,
    !isStill && !isHeld,
  );

  return (
    <section
      aria-label="Valence on a phone"
      className="relative mx-auto max-w-6xl px-5 py-24 sm:px-10 xl:max-w-7xl"
    >
      <ByTheWay
        lead="By the way..."
        drawing={LanguageIcon}
        isRightAligned
        className="right-[4%] top-16 hidden w-64 xl:block"
      >
        Every word is in one strings file, ready to be translated.
      </ByTheWay>

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-10">
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:self-end">
          <h2 className="max-w-xl text-balance text-4xl font-semibold tracking-tight text-text lg:text-6xl">
            In your pocket, on{' '}
            <span className="font-accent font-normal italic tracking-normal">your</span> server.
          </h2>
          <p className="max-w-md text-balance text-lg text-text-muted">
            The phone app plays everything on your own server, and keeps it for when there is no
            signal.
          </p>
        </div>

        <IsoPhone
          screens={POCKET_FEATURES}
          active={active}
          className="mx-auto w-full max-w-[36rem] lg:col-start-2 lg:row-span-2 lg:row-start-1"
        />

        <ul
          className="flex flex-col lg:col-start-1 lg:row-start-2 lg:self-start"
          onPointerEnter={() => {
            setIsHeld(true);
          }}
          onPointerLeave={() => {
            setIsHeld(false);
          }}
        >
          {POCKET_FEATURES.map((feature, at) => {
            const isActive = at === active;

            return (
              <li key={feature.title} className="relative">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-px bg-[var(--surface-line)]"
                />
                {isActive ? (
                  <motion.span
                    aria-hidden
                    style={{ scaleY: isStill ? 1 : progress }}
                    className="absolute inset-y-0 left-0 w-px origin-top bg-text"
                  />
                ) : null}
                <Button
                  variant="bare"
                  size="none"
                  aria-pressed={isActive}
                  onClick={() => {
                    select(at);
                  }}
                  onFocus={() => {
                    setIsHeld(true);
                  }}
                  onBlur={() => {
                    setIsHeld(false);
                  }}
                  className="flex w-full flex-col items-start gap-1 py-4 pl-6 text-left"
                >
                  <span
                    className={cn(
                      'text-lg font-semibold tracking-tight transition-colors duration-300',
                      isActive ? 'text-text' : 'text-text-muted',
                    )}
                  >
                    {feature.title}
                  </span>
                  <span
                    className={cn(
                      'text-base leading-relaxed transition-colors duration-300',
                      isActive ? 'text-text-muted' : 'text-text-muted/70',
                    )}
                  >
                    {feature.detail}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

PocketSection.displayName = 'PocketSection';

export { PocketSection };
