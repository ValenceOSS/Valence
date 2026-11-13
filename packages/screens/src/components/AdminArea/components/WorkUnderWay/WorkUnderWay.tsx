import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { NoticeCard } from '@ValenceUI/NoticeCard';
import { Spinner } from '@ValenceUI/Spinner';
import { StepTrail } from '@ValenceUI/StepTrail';
import { describeScanPhase } from '@ValenceScreens/components/AdminArea/describeScanPhase';
import { summariseProgress } from '@ValenceScreens/components/AdminArea/components/JobRunner/summariseProgress';
import type { StepTrailStep } from '@ValenceUI/StepTrail.types';
import type { WorkUnderWayProps } from './WorkUnderWay.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * What Valence is working on, kept in the corner of every admin page so nobody has to go looking: a
 * notice saying how many jobs are running and waiting, and inside it each job as a step, with the
 * stage it has reached, the file it is on, and how far through it is where it counts. It can be
 * tucked away to a round button holding only a spinner, which widens to say what it is while it
 * is pointed at or focused, the card springing down into it and back out again, and starts
 * that way. Open, it blurs the page behind it, and a press anywhere but the card, or Escape, tucks
 * it away again. It is gone altogether while nothing is running. Where it sits is the caller's.
 *
 * @param working - The jobs the server is running or has waiting.
 * @param progress - What each running job reports about how far it has got.
 * @param definitions - The jobs the server knows, for what each is called.
 * @param libraries - The libraries, for naming the one a job is working on.
 */
const WorkUnderWay = ({ working, progress, definitions, libraries }: WorkUnderWayProps) => {
  const [isTucked, setIsTucked] = useState(true);
  const [isPointedAt, setIsPointedAt] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const jobs = working.filter((job) => job.state === 'running' || job.state === 'queued');
  const running = jobs.filter((job) => job.state === 'running').length;
  const waiting = jobs.length - running;
  const entries = [...progress.values()];

  const steps = jobs.map((job): StepTrailStep => {
    const definition = definitions.find((one) => one.kind === job.kind);
    const library = libraries.find((one) => one.id === job.subject || one.name === job.subject);
    const theirs = entries.filter(
      (entry) =>
        entry.kind === job.kind && (library === undefined || entry.libraryId === library.id),
    );
    const summary = job.state === 'running' ? summariseProgress(theirs) : null;
    const name = definition === undefined ? job.kind : sayAgain(definition.label);
    const said = [
      summary?.phase === null || summary?.phase === undefined
        ? null
        : describeScanPhase(summary.phase),
      summary?.item ?? null,
    ].filter((part) => part !== null);

    return {
      id: job.id.toString(),
      label: library === undefined || job.subject === '' ? name : `${name} · ${library.name}`,
      detail:
        job.state === 'queued'
          ? say('screens.adminArea.workUnderWay.waitingItsTurn')
          : said.join(' · ') || undefined,
      mark: job.state === 'running' ? 'current' : 'waiting',
      ...(summary === null || summary.processed === null || summary.total === null
        ? {}
        : {
            aside: {
              kind: 'badge' as const,
              tone: 'quiet' as const,
              text: say('screens.adminArea.workUnderWay.processedOfTotal', {
                processed: summary.processed.toLocaleString(),
                total: summary.total.toLocaleString(),
              }),
            },
          }),
    };
  });

  const title = sayCount('screens.adminArea.workUnderWay.workingOn', jobs.length);
  const isOpen = !isTucked && jobs.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const tuckFromOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && card.current?.contains(event.target) !== true) {
        setIsTucked(true);
      }
    };
    const tuckOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTucked(true);
      }
    };

    document.addEventListener('pointerdown', tuckFromOutside);
    document.addEventListener('keydown', tuckOnEscape);

    return () => {
      document.removeEventListener('pointerdown', tuckFromOutside);
      document.removeEventListener('keydown', tuckOnEscape);
    };
  }, [isOpen]);
  const morph = isStill
    ? { duration: 0 }
    : { type: 'spring' as const, bounce: 0.35, duration: 0.55 };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="blur"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isStill ? 0 : 0.25, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 -z-10 bg-[color-mix(in_oklab,var(--frame-back)_35%,transparent)] backdrop-blur-md"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {jobs.length === 0 ? null : (
          <motion.div
            key="work"
            initial={isStill ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={isStill ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-end"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isTucked ? (
                <motion.div
                  key="pill"
                  layoutId="work-under-way"
                  className="pointer-events-auto"
                  transition={morph}
                  style={{ borderRadius: 999 }}
                  initial={isStill ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="raised"
                    size="xl"
                    isPill
                    label={title}
                    hasTooltip={false}
                    onClick={() => {
                      setIsPointedAt(false);
                      setIsTucked(false);
                    }}
                    onPointerEnter={() => {
                      setIsPointedAt(true);
                    }}
                    onPointerLeave={() => {
                      setIsPointedAt(false);
                    }}
                    onFocus={() => {
                      setIsPointedAt(true);
                    }}
                    onBlur={() => {
                      setIsPointedAt(false);
                    }}
                    className="gap-0 px-2.5"
                  >
                    <Spinner size="md" label={title} />
                    <motion.span
                      aria-hidden
                      initial={false}
                      animate={{
                        width: isPointedAt ? 'auto' : 0,
                        opacity: isPointedAt ? 1 : 0,
                        marginLeft: isPointedAt ? 10 : 0,
                      }}
                      transition={morph}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium"
                    >
                      {title}
                    </motion.span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="card"
                  ref={card}
                  layoutId="work-under-way"
                  className="pointer-events-auto"
                  transition={morph}
                  style={{ borderRadius: 16 }}
                  initial={isStill ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <NoticeCard
                    tone="working"
                    title={title}
                    tags={[
                      ...(running === 0
                        ? []
                        : [sayCount('screens.adminArea.workUnderWay.running', running)]),
                      ...(waiting === 0
                        ? []
                        : [sayCount('screens.adminArea.workUnderWay.waiting', waiting)]),
                    ]}
                    onDismiss={() => {
                      setIsTucked(true);
                    }}
                  >
                    <div className="valence-scrollbar max-h-[45vh] overflow-y-auto">
                      <StepTrail
                        label={say('screens.adminArea.workUnderWay.whatValenceIsDoing')}
                        steps={steps}
                      />
                    </div>
                  </NoticeCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

WorkUnderWay.displayName = 'WorkUnderWay';

export { WorkUnderWay };
