import { useEffect, useState } from 'react';
import { X as XIcon } from '@keyline-icons/react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { fadeVariants, revealTransition } from '@ValenceUI/animations/reveal';
import { DESKTOP_APP_ADDRESS } from '@ValenceScreens/desktop/DESKTOP_APP_ADDRESS';
import { desktopAppOffer } from '@ValenceScreens/desktop/desktopAppOffer';
import type { GetTheDesktopAppProps } from './GetTheDesktopApp.types';
import { say } from '@ValenceI18n/say';

const PUT_AWAY = 'valence.getTheDesktopApp.putAway';

const WAITS_MS = 20_000;

const ARRIVING = {
  hidden: { opacity: 0, y: '20%' },
  shown: { opacity: 1, y: 0 },
  gone: { opacity: 0, y: '20%' },
};

/**
 * Whether somebody has already put the offer away on this browser, read carefully because a private
 * window may refuse the question.
 *
 * @returns Whether it was put away.
 */
const wasPutAway = (): boolean => {
  try {
    return localStorage.getItem(PUT_AWAY) === 'yes';
  } catch {
    return false;
  }
};

/**
 * Remembers on this browser that the offer was put away, for good, where the browser lets it.
 */
const rememberPutAway = (): void => {
  try {
    localStorage.setItem(PUT_AWAY, 'yes');
  } catch {
    return;
  }
};

/**
 * A small note in the corner that Valence has a desktop app for the computer this page is open on,
 * and what it adds over the browser. Quieter than the phone's offer, because a browser on a computer
 * already does the job well: it belongs to the library itself rather than the way in or a setup
 * link, and waits a little before arriving, sits in the corner the music player does not use, and once put away it
 * stays away on this browser.
 *
 * @param waitsMs - How long the page is open before it arrives.
 */
const GetTheDesktopApp = ({ waitsMs = WAITS_MS }: GetTheDesktopAppProps) => {
  const [system] = useState(desktopAppOffer);
  const [isPutAway, setIsPutAway] = useState(wasPutAway);
  const [hasWaited, setHasWaited] = useState(false);
  const prefersReducedMotion = useReducedMotionConfig();

  useEffect(() => {
    const waiting = setTimeout(() => {
      setHasWaited(true);
    }, waitsMs);

    return () => {
      clearTimeout(waiting);
    };
  }, [waitsMs]);

  const isShown = system !== null && !isPutAway && hasWaited;

  return (
    <AnimatePresence>
      {isShown ? (
        <motion.aside
          key="get-the-desktop-app"
          aria-label={say('screens.getTheDesktopApp.valenceForSystem', { system })}
          variants={prefersReducedMotion === true ? fadeVariants : ARRIVING}
          initial="hidden"
          animate="shown"
          exit="gone"
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className="fixed right-4 bottom-4 z-40 w-96 pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="valence-card-shell">
            <div className="valence-card-face valence-card-face--raised flex items-center gap-3 p-3">
              <span className="flex shrink-0 px-2">
                <Logo size={28} isSolid />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-semibold text-text">
                  {say('screens.getTheDesktopApp.valenceForSystem', { system })}
                </p>
                <p className="text-xs text-text-muted">
                  {say('screens.getTheDesktopApp.itsOwnWindowDownloadsToWatch')}
                </p>
              </div>

              <Button
                variant="glossy"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  window.open(DESKTOP_APP_ADDRESS, '_blank', 'noopener,noreferrer');
                }}
              >
                {say('screens.getTheDesktopApp.getIt')}
              </Button>

              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                label={say('common.notNow')}
                onClick={() => {
                  rememberPutAway();
                  setIsPutAway(true);
                }}
              >
                <Icon of={XIcon} size={16} />
              </Button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};

GetTheDesktopApp.displayName = 'GetTheDesktopApp';

export { GetTheDesktopApp };
