import { motion } from 'motion/react';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { describeCalendarEntry } from '@ValenceClient/calendar/describeCalendarEntry';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { ArtCard } from '@ValenceUI/ArtCard';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { say } from '@ValenceI18n/say';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarUpNextProps } from './CalendarUpNext.types';

const SHOWN = 4;

const IN_A_NARROW_ROW = 2;

/**
 * The picture a card of something coming out is drawn from: the episode's own still where the
 * catalogue has one, so each episode of a programme looks like itself, then the title's backdrop —
 * the library's where it holds the title, the catalogue's, kept on this server, where it was only
 * asked for — and its logo, and failing those the poster of what was asked for.
 *
 * @param entry - What comes out.
 * @returns The card's picture and logo, where it has them.
 */
const pictureOf = (entry: CalendarEntry): { imageUrl?: string; logoUrl?: string } => {
  const held = entry.artworkMediaId;
  const logoUrl = held === null ? entry.logoUrl : artworkUrl(held, 'logo', { isOfTitle: true });
  const backdrop =
    held === null ? entry.backdropUrl : artworkUrl(held, 'backdrop', { isOfTitle: true });
  const imageUrl = entry.episode?.stillUrl ?? backdrop ?? entry.posterUrl;

  return {
    ...(imageUrl === null ? {} : { imageUrl }),
    ...(logoUrl === null ? {} : { logoUrl }),
  };
};

/**
 * The next few things to come out, from today on, as the pictures they are: each episode its own
 * still with its programme's logo, the day it comes out across its foot, and which episode or release
 * it is beneath. Four across on a wide screen, and two on anything narrower. Says nothing where
 * nothing in the days shown is still to come.
 *
 * @param entries - What is released in the days shown, in order.
 * @param today - Today, before which nothing is shown.
 * @param onOpen - Opens an entry.
 */
const CalendarUpNext = ({ entries, today, onOpen }: CalendarUpNextProps) => {
  const next = entries.filter((entry) => entry.date >= today).slice(0, SHOWN);

  if (next.length === 0) {
    return null;
  }

  return (
    <HeadedSection title={say('common.comingUp')}>
      <motion.ul
        variants={groupVariants}
        initial="hidden"
        animate="shown"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {next.map((entry, at) => (
          <RevealItem
            key={`${entry.id}:${entry.date}`}
            index={at}
            className={cn('flex-col gap-2', at < IN_A_NARROW_ROW ? 'flex' : 'hidden xl:flex')}
          >
            <ArtCard
              title={entry.title}
              {...pictureOf(entry)}
              flag={nameTheDay(entry.date, today)}
              onSelect={() => {
                onOpen(entry);
              }}
            />
            <span className="truncate px-1 text-sm text-text-muted">
              {describeCalendarEntry(entry)}
            </span>
          </RevealItem>
        ))}
      </motion.ul>
    </HeadedSection>
  );
};

CalendarUpNext.displayName = 'CalendarUpNext';

export { CalendarUpNext };
