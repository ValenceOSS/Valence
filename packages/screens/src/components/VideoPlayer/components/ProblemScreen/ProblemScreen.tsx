import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  CloudAlert as CloudAlertIcon,
  FileAlert as FileAlertIcon,
  ShieldAlert as ShieldAlertIcon,
  SquarePlayOff as SquarePlayOffIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { PlaybackProblemGroup } from '@ValenceContracts/schemas/PlaybackProblem';
import type { ProblemScreenProps } from './ProblemScreen.types';
import { say } from '@ValenceI18n/say';

const ICONS: Readonly<Record<PlaybackProblemGroup, typeof FileAlertIcon>> = {
  file: FileAlertIcon,
  format: SquarePlayOffIcon,
  connection: CloudAlertIcon,
  account: ShieldAlertIcon,
  player: TriangleAlertIcon,
  download: FileAlertIcon,
  source: CloudAlertIcon,
};

const COPIED_FOR_MS = 1600;

/**
 * What fills the player when something stops it for good: the picture held behind a heavy blur,
 * and over it what is wrong in a few words, what to do about it, a way to copy the details for the
 * server's admin, and the error's code, which the documentation lists. Trying again is offered where it can help, and signing in where the sign-in
 * lapsed. The player's own header stays above it, so leaving works as it always does.
 *
 * Where the browser cannot blur what is behind an element, the picture is darkened instead, and
 * with reduced motion it appears rather than fading in.
 *
 * @param problem - What went wrong, described, or nothing while nothing has.
 * @param details - What copying the details puts on the clipboard.
 * @param onRetry - What trying again does, where it is offered.
 * @param onSignIn - What signing in does, where it is offered.
 */
const ProblemScreen = ({ problem, details, onRetry, onSignIn }: ProblemScreenProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;
  const [isCopied, setIsCopied] = useState(false);

  return (
    <AnimatePresence>
      {problem === null ? null : (
        <motion.div
          key="problem"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-30 grid place-items-center bg-shade/90 px-6 text-center text-on-scrim supports-[backdrop-filter:blur(1px)]:bg-shade/55 supports-[backdrop-filter:blur(1px)]:backdrop-blur-[40px] supports-[backdrop-filter:blur(1px)]:backdrop-saturate-125"
        >
          <motion.div
            initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-xl flex-col items-center"
          >
            <span className="mb-5 grid size-15 place-items-center rounded-full border border-overlay-line bg-overlay backdrop-blur-md">
              <Icon of={ICONS[problem.group]} size={28} />
            </span>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{problem.heading}</h2>

            <p className="mt-2.5 text-base font-medium text-on-scrim/70 sm:text-lg">
              {problem.line}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {problem.action === 'retry' && onRetry !== undefined ? (
                <Button variant="primary" size="lg" isPill onClick={onRetry}>
                  {say('common.tryAgain')}
                </Button>
              ) : null}

              {problem.action === 'signIn' && onSignIn !== undefined ? (
                <Button variant="primary" size="lg" isPill onClick={onSignIn}>
                  {say('screens.profileGate.signIn')}
                </Button>
              ) : null}

              <Button
                variant="overlay"
                size="md"
                isPill
                onClick={() => {
                  void navigator.clipboard.writeText(details).then(
                    () => {
                      setIsCopied(true);
                      setTimeout(() => {
                        setIsCopied(false);
                      }, COPIED_FOR_MS);
                    },
                    () => undefined,
                  );
                }}
              >
                {isCopied
                  ? say('common.copied')
                  : say('client.playback.playbackProblems.copyDetails')}
              </Button>
            </div>

            <p className="mt-5 text-xs font-semibold tracking-wide text-on-scrim/50">
              {say('client.playback.playbackProblems.errorCode', { code: problem.code.toString() })}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ProblemScreen.displayName = 'ProblemScreen';

export { ProblemScreen };
