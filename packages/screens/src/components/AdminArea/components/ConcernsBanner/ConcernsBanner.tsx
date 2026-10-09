import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import {
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  TriangleAlert as TriangleAlertIcon,
  X as XIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { ConcernTone } from '@ValenceScreens/components/AdminArea/collectConcerns';
import type { ConcernsBannerProps } from './ConcernsBanner.types';
import { say } from '@ValenceI18n/say';

const TONE_CLASSES: Record<ConcernTone, string> = {
  broken: 'text-danger',
  attention: 'text-busy',
  setup: 'text-text-muted',
};

/**
 * What needs a person, above everything else on the admin page. Each concern is pressable and opens
 * the panel it can be dealt with in, so being told about a problem and getting to it are one gesture
 * rather than two. A concern that stands for several things — three indexers failing — opens in place
 * instead, to list each with its own reason and a way on to the panel. Each can also be dismissed,
 * for a problem somebody knows about and has chosen to live with. Its mark is coloured by how bad it
 * is: red for broken, amber for needing attention, muted for setting up.
 *
 * @param concerns - What is wrong, worst first.
 * @param onOpenPanel - Called with the panel a concern is dealt with in, and what to narrow it to
 *   where the concern says.
 * @param onDismiss - Called with a concern somebody dismissed.
 */
const ConcernsBanner = ({ concerns, onOpenPanel, onDismiss }: ConcernsBannerProps) => {
  const [opened, setOpened] = useState<string | null>(null);
  const isStill = useReducedMotion() === true;
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  if (concerns.length === 0) {
    return null;
  }

  return (
    <section aria-label={say('common.needsAttention')} className="valence-card-shell flex flex-col">
      <span className="flex items-center justify-between px-2.5 pb-1.5 pt-1.5 text-[0.6875rem] font-medium text-text-muted">
        <span>{say('common.needsAttention')}</span>
        <span className="tabular-nums">{concerns.length}</span>
      </span>

      <div
        ref={containerRef}
        className="valence-card-face relative p-1.5"
        onPointerMove={follow}
        onPointerLeave={clear}
      >
        <HoverHighlight rect={rect} radius="md" />

        <ul className="relative flex flex-col divide-y divide-[var(--surface-line)]">
          {concerns.map((concern) => (
            <li key={concern.id} className="flex flex-col">
              <span data-highlight={concern.id} className="flex items-center gap-1 pr-1.5">
                <Button
                  variant="bare"
                  className="flex h-auto min-w-0 flex-1 items-center justify-start gap-3 rounded-md px-3 py-2.5 text-left"
                  {...(concern.items === undefined
                    ? {}
                    : { 'aria-expanded': opened === concern.id })}
                  onClick={() => {
                    if (concern.items === undefined) {
                      onOpenPanel(concern.panel, concern.search);

                      return;
                    }

                    setOpened((was) => (was === concern.id ? null : concern.id));
                  }}
                >
                  <span className={`mt-0.5 shrink-0 ${TONE_CLASSES[concern.tone]}`}>
                    {concern.tone === 'setup' ? (
                      <Icon of={InfoIcon} size={16} />
                    ) : (
                      <Icon of={TriangleAlertIcon} size={16} />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm text-text">{concern.title}</span>
                    <span className="truncate text-xs text-text-muted">{concern.detail}</span>
                  </span>

                  <Icon
                    of={ChevronRightIcon}
                    size={14}
                    tone="muted"
                    className={
                      concern.items !== undefined && opened === concern.id
                        ? 'shrink-0 rotate-90 transition-transform'
                        : 'shrink-0 transition-transform'
                    }
                  />
                </Button>

                <HowToFix href={concern.help} />

                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={say('screens.adminArea.concernsBanner.dismissTitle', {
                    title: concern.title,
                  })}
                  onClick={() => {
                    onDismiss(concern);
                  }}
                >
                  <Icon of={XIcon} size={14} />
                </Button>
              </span>

              <AnimatePresence initial={false}>
                {concern.items === undefined || opened !== concern.id ? null : (
                  <motion.div
                    key="items"
                    initial={isStill ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={isStill ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={isStill ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: isStill ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 pb-3 pl-10 pr-3">
                      <ul className="flex flex-col gap-2">
                        {concern.items.map((item) => (
                          <li key={item.name} className="flex flex-col gap-0.5 text-sm">
                            <span className="font-medium text-text">{item.name}</span>
                            <span className="text-xs text-text-muted">{item.problem}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="self-start"
                        onClick={() => {
                          onOpenPanel(concern.panel, concern.search);
                        }}
                      >
                        {say('screens.adminArea.concernsBanner.goToPanel', {
                          panel: concern.panel,
                        })}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

ConcernsBanner.displayName = 'ConcernsBanner';

export { ConcernsBanner };
