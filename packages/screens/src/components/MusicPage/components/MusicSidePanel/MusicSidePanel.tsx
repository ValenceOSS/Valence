import { useReducedMotionConfig, motion } from 'motion/react';
import {
  LaptopSmartphone as DevicesIcon,
  ListMusic as QueueIcon,
  Mic as LyricsIcon,
  Users as PartyIcon,
  X as XIcon,
} from '@keyline-icons/react';
import {
  LaptopSmartphone as DevicesFilledIcon,
  ListMusic as QueueFilledIcon,
  Mic as LyricsFilledIcon,
  Users as PartyFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { setMusicPanel } from '@ValenceScreens/music/musicPanel';
import { DevicesPanel } from '@ValenceScreens/components/MusicPage/components/DevicesPanel/DevicesPanel';
import { ListeningPartyPanel } from '@ValenceScreens/components/MusicPage/components/ListeningPartyPanel/ListeningPartyPanel';
import { LyricsPanel } from '@ValenceScreens/components/MusicPage/components/LyricsPanel/LyricsPanel';
import { QueuePanel } from '@ValenceScreens/components/MusicPage/components/QueuePanel/QueuePanel';
import type { MusicSidePanelProps } from './MusicSidePanel.types';
import { say } from '@ValenceI18n/say';

const SETTLING = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const;

const TABS = [
  { id: 'lyrics', label: say('common.lyrics'), of: LyricsIcon, lit: LyricsFilledIcon },
  { id: 'queue', label: say('common.queue'), of: QueueIcon, lit: QueueFilledIcon },
  {
    id: 'devices',
    label: say('common.playOnAnotherDevice'),
    of: DevicesIcon,
    lit: DevicesFilledIcon,
  },
  { id: 'party', label: say('common.listeningParty'), of: PartyIcon, lit: PartyFilledIcon },
] as const;

/**
 * The column down the right of the music section: one place for the words, the queue, the other
 * devices and the party, with a tab for each. Closing it folds it to a strip of those tabs rather
 * than taking it away, so any of them is still one press from coming back. What is in it settles in
 * rather than the column sliding, so the page beside it is only moved once.
 *
 * @param panel - Which is showing, or nothing while it is folded.
 */
const MusicSidePanel = ({ panel }: MusicSidePanelProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const title = TABS.find(({ id }) => id === panel)?.label;

  const tabs = TABS.map(({ id, label, of, lit }) => (
    <Button
      key={id}
      variant="bare"
      size="none"
      label={label}
      aria-pressed={panel === id}
      className={cn(
        'flex size-9 items-center justify-center rounded-[0.625rem] transition-colors duration-[var(--duration-fast)]',
        panel === id
          ? 'bg-hover text-text'
          : 'text-text-muted hover-hover:hover:bg-hover hover-hover:hover:text-text',
      )}
      onClick={() => {
        setMusicPanel(id);
      }}
    >
      <Icon of={of} whenActive={lit} isActive={panel === id} size={18} />
    </Button>
  ));

  if (panel === null) {
    return (
      <aside
        aria-label={say('common.music')}
        className="hidden h-full w-[3.75rem] shrink-0 flex-col items-center gap-1 bg-surface-raised pt-3 lg:flex"
      >
        {tabs}
      </aside>
    );
  }

  return (
    <aside
      aria-label={title}
      className="hidden h-full min-h-0 w-[22rem] shrink-0 flex-col bg-surface-raised lg:flex"
    >
      <div className="flex shrink-0 items-center gap-1 px-3 pt-3 pb-2">
        {tabs}

        <Button
          variant="ghost"
          size="xs"
          isIconOnly
          label={say('screens.musicPage.closePANELTITLES', {
            PANEL_TITLES: (title ?? '').toLowerCase(),
          })}
          className="ml-auto"
          onClick={() => {
            setMusicPanel(null);
          }}
        >
          <Icon of={XIcon} size={16} />
        </Button>
      </div>

      <motion.div
        key={panel}
        initial={isStill ? { opacity: 0 } : { opacity: 0, transform: 'translateX(0.5rem)' }}
        animate={isStill ? { opacity: 1 } : { opacity: 1, transform: 'translateX(0)' }}
        transition={SETTLING}
        className="valence-rail min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3"
      >
        {panel === 'queue' ? (
          <QueuePanel />
        ) : panel === 'lyrics' ? (
          <LyricsPanel />
        ) : panel === 'devices' ? (
          <DevicesPanel />
        ) : (
          <ListeningPartyPanel />
        )}
      </motion.div>
    </aside>
  );
};

MusicSidePanel.displayName = 'MusicSidePanel';

export { MusicSidePanel };
