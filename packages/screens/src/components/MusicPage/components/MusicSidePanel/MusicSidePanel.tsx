import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { ChevronLeft as ChevronLeftIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { setMusicPanel } from '@ValenceScreens/music/musicPanel';
import { DevicesPanel } from '@ValenceScreens/components/MusicPage/components/DevicesPanel/DevicesPanel';
import { ListeningPartyPanel } from '@ValenceScreens/components/MusicPage/components/ListeningPartyPanel/ListeningPartyPanel';
import { LyricsPanel } from '@ValenceScreens/components/MusicPage/components/LyricsPanel/LyricsPanel';
import { QueuePanel } from '@ValenceScreens/components/MusicPage/components/QueuePanel/QueuePanel';
import type { MusicPanel } from '@ValenceScreens/music/musicPanel';
import type { MusicSidePanelProps } from './MusicSidePanel.types';
import { say } from '@ValenceI18n/say';

const OPEN_WIDTH = '22rem';

const FOLDED_WIDTH = '1.75rem';

const LEANING_WIDTH = 'calc(1.75rem + 10px)';

const MOVING = { duration: 0.32, ease: [0.32, 0.72, 0, 1] } as const;

const LEANING = { duration: 0.16, ease: [0.23, 1, 0.32, 1] } as const;

const STILL = { duration: 0 } as const;

const TABS = [
  { id: 'lyrics', label: say('common.lyrics') },
  { id: 'queue', label: say('common.queue') },
  { id: 'devices', label: say('common.playOnAnotherDevice') },
  { id: 'party', label: say('common.listeningParty') },
] as const;

/**
 * The column down the right of the music section: one place for the words, the queue, the other
 * devices and the party, chosen from the player bar. Closing it folds it to a thin strip with one arrow,
 * which leans out towards the pointer and brings back whichever was last open. What is inside
 * keeps its width and fades as the column moves, so the words do not wrap anew on every frame.
 *
 * @param panel - Which is showing, or nothing while it is folded.
 */
const MusicSidePanel = ({ panel }: MusicSidePanelProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const [last, setLast] = useState<Exclude<MusicPanel, null>>(panel ?? 'lyrics');
  const [isLeaning, setIsLeaning] = useState(false);
  const [hasFolded, setHasFolded] = useState(panel === null);
  const isMovingRef = useRef(false);
  const shown = panel ?? last;
  const isOpen = panel !== null;
  const title = TABS.find(({ id }) => id === shown)?.label ?? '';

  useEffect(() => {
    if (panel === null) {
      return;
    }

    setLast(panel);
    setHasFolded(false);
    setIsLeaning(false);
  }, [panel]);

  useEffect(() => {
    isMovingRef.current = true;
  }, [isOpen]);

  return (
    <motion.aside
      aria-label={isOpen ? title : say('common.music')}
      initial={false}
      animate={{ width: isOpen ? OPEN_WIDTH : isLeaning ? LEANING_WIDTH : FOLDED_WIDTH }}
      transition={isStill ? STILL : isOpen || !hasFolded ? MOVING : LEANING}
      onAnimationComplete={() => {
        if (!isOpen && isMovingRef.current) {
          setHasFolded(true);
        }

        isMovingRef.current = false;
      }}
      className="relative hidden h-full shrink-0 overflow-hidden lg:block"
    >
      {hasFolded && !isOpen ? null : (
        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={isStill ? STILL : MOVING}
          inert={!isOpen}
          className="absolute inset-y-0 start-0 flex w-[22rem] flex-col"
        >
          <div className="flex shrink-0 items-center justify-between gap-1 px-4 pt-3 pb-2">
            <h2 className="text-base font-semibold tracking-tight text-text">{title}</h2>

            <Button
              variant="ghost"
              size="xs"
              isIconOnly
              label={say('screens.musicPage.closePANELTITLES', {
                PANEL_TITLES: title.toLowerCase(),
              })}
              onClick={() => {
                setMusicPanel(null);
              }}
            >
              <Icon of={XIcon} size={16} />
            </Button>
          </div>

          <div className="valence-rail min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6">
            {shown === 'queue' ? (
              <QueuePanel />
            ) : shown === 'lyrics' ? (
              <LyricsPanel />
            ) : shown === 'devices' ? (
              <DevicesPanel />
            ) : (
              <ListeningPartyPanel />
            )}
          </div>
        </motion.div>
      )}

      {isOpen ? null : (
        <Button
          variant="subtle"
          size="none"
          label={say('common.openTitle', { title })}
          className="absolute inset-0 flex items-center justify-center"
          onPointerEnter={() => {
            setIsLeaning(true);
          }}
          onPointerLeave={() => {
            setIsLeaning(false);
          }}
          onFocus={() => {
            setIsLeaning(true);
          }}
          onBlur={() => {
            setIsLeaning(false);
          }}
          onClick={() => {
            setMusicPanel(last);
          }}
        >
          <Icon of={ChevronLeftIcon} size={18} />
        </Button>
      )}
    </motion.aside>
  );
};

MusicSidePanel.displayName = 'MusicSidePanel';

export { MusicSidePanel };
