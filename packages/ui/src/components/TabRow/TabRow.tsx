import * as RadixTabs from '@radix-ui/react-tabs';
import { useEffect, useRef } from 'react';
import { cn } from '@ValenceUI/cn';
import { SlidingMark } from '@ValenceUI/SlidingMark';
import { SEGMENTED } from '@ValenceUI/tokens/segmented';
import { UNDERLINED } from '@ValenceUI/tokens/underlined';
import type { TabRowProps } from './TabRow.types';

/**
 * A row of places, for a set of destinations rather than a set of panels — the distinction being
 * that these change where you are, not what is under a bar. Items can be grouped, with a hairline
 * between the groups.
 *
 * Drawn either as a track of pills or as labels along a rule. A track reads as a control with a
 * setting, which suits a row sitting loose on a page; underlined labels read as the top of the
 * thing beneath them, which is what a row at the head of a dialog is. Plain, each is a word with its
 * icon and the current one sits on a filled mark, with no track around them, for the row of pages
 * across the top of an area. The mark travels every way,
 * because a highlight that jumps reads as two highlights taking turns. Where the row is wider than
 * its room it scrolls across, and the current place is brought into view whenever it changes.
 *
 * @param groups - The places, in groups.
 * @param value - Which place is current, so the highlight can travel to it.
 * @param label - What the row is for, read out to anybody who cannot see it.
 * @param size - How large the row stands.
 * @param tone - Whether it is a track of pills, labels along a rule, or plain words on a mark.
 * @param className - Extra classes for the caller's own layout.
 */
const TabRow = ({ label, groups, value, size = 'md', tone = 'track', className }: TabRowProps) => {
  const isUnderlined = tone === 'underlined';
  const isPlain = tone === 'plain';
  const row = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    row.current
      ?.querySelector('[data-state="active"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  return (
    <RadixTabs.List
      ref={row}
      aria-label={label}
      className={cn(
        isUnderlined
          ? UNDERLINED.track
          : isPlain
            ? 'valence-rail relative isolate flex max-w-full items-center gap-1 overflow-x-auto'
            : cn(SEGMENTED.track, SEGMENTED.tones.inverted.track, SEGMENTED.trackSizes[size]),
        className,
      )}
    >
      {groups.map((group, index) => (
        <div
          key={group.label ?? `group-${index.toString()}`}
          className={cn('flex shrink-0 items-center', isUnderlined ? 'gap-6' : 'gap-1')}
        >
          {index === 0 ? null : (
            <span
              aria-hidden
              className={cn(
                'w-px shrink-0 bg-[var(--surface-divider)]',
                isUnderlined ? 'my-2 h-5 self-center' : 'mx-1 h-5',
              )}
            />
          )}

          {group.items.map((item) => (
            <RadixTabs.Trigger
              key={item.id}
              value={item.id}
              className={cn(
                isUnderlined ? UNDERLINED.item : SEGMENTED.item,
                isUnderlined
                  ? UNDERLINED.itemSizes[size]
                  : isPlain
                    ? 'h-9 gap-2 rounded-lg px-3 text-sm font-medium'
                    : SEGMENTED.itemSizes[size],
                isUnderlined
                  ? 'data-[state=active]:font-semibold data-[state=active]:text-text'
                  : cn(
                      'data-[state=active]:font-semibold data-[state=active]:text-text',
                      'data-[state=active]:hover:text-text data-[state=active]:focus-visible:text-text',
                    ),
              )}
            >
              {value === item.id ? (
                <SlidingMark
                  group={`tab-row-${label}`}
                  className={
                    isUnderlined
                      ? UNDERLINED.mark
                      : isPlain
                        ? 'rounded-lg bg-[var(--surface-active)]'
                        : SEGMENTED.tones.inverted.mark
                  }
                />
              ) : null}
              {item.leading === undefined ? null : (
                <span className="relative flex shrink-0">{item.leading}</span>
              )}
              <span className="relative">{item.label}</span>
            </RadixTabs.Trigger>
          ))}
        </div>
      ))}
    </RadixTabs.List>
  );
};

TabRow.displayName = 'TabRow';

export { TabRow };
