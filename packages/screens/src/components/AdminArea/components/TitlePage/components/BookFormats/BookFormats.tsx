import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { describeNarration } from '@ValenceClient/requests/describeNarration';
import { partOfItem } from '@ValenceClient/requests/partOfItem';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import type { BookFormatsProps } from './BookFormats.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * A book's formats on its page: the ebook as one block, and the audiobook as one block for each of
 * its parts, so one in several files shows each, coloured by where it stands — with who reads it
 * and how long it lasts.
 *
 * @param items - The book's formats, as its request waits for them.
 * @param approval - Whether its request is approved.
 * @param narrations - The narrations of its audiobook.
 */
const BookFormats = ({ items, approval, narrations }: BookFormatsProps) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => {
      const part = partOfItem(item, approval);
      const look = TITLE_PART_LOOKS[part];
      const isAudio = item.format === 'audiobook';
      const parts = isAudio ? Math.max(item.trackCount ?? 1, 1) : 1;
      const narration = narrations.find((one) => one.asin === item.narration);
      const name = isAudio ? say('common.audiobook') : say('common.ebook');

      return (
        <li key={item.id} className="flex flex-wrap items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-text">{name}</span>
          <span
            role="img"
            aria-label={
              isAudio && parts > 1
                ? sayCount('screens.adminArea.titlePage.bookFormats.partsWhereTheyStand', parts, {
                    stands: look.label,
                  })
                : look.label
            }
            className="flex min-w-24 flex-1 gap-[3px] overflow-hidden rounded-full"
          >
            {Array.from({ length: parts }, (_unused, at) => (
              <span key={at} className={cn('h-2 min-w-0 flex-1', look.cell)} />
            ))}
          </span>
          {narration === undefined ? null : (
            <span className="text-xs text-text-muted">{describeNarration(narration)}</span>
          )}
          <Badge size="sm" tone={look.tone}>
            {look.label}
          </Badge>
        </li>
      );
    })}
  </ul>
);

BookFormats.displayName = 'BookFormats';

export { BookFormats };
