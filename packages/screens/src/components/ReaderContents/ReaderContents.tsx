import { useCallback, useEffect, useRef, useState } from 'react';
import { ListOrdered as ListOrderedIcon } from '@keyline-icons/react';
import { ListOrdered as ListOrderedFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { ScrollFade } from '@ValenceUI/ScrollFade';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import type { ReaderContentsProps } from './ReaderContents.types';
import { say } from '@ValenceI18n/say';

const INDENT_REM = 0.875;

/**
 * A book's contents, or a series' volumes, as a list dropped from the reader's top bar the way the
 * player lists its chapters: the place open now held still and lit, the rest dimmed until pointed
 * at, and the list opening already scrolled to where somebody is.
 *
 * @param label - What the list is, such as contents or volumes.
 * @param entries - The places to go, each indented as deep as it sits in the book.
 * @param currentId - The place open now, where it is known.
 * @param onSelect - Told a place was chosen.
 * @param onOpenChange - Told when it opens or closes, so the reader can keep its bars up meanwhile.
 */
const ReaderContents = ({
  label,
  entries,
  currentId,
  onSelect,
  onOpenChange,
}: ReaderContentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const currentRef = useRef<HTMLLIElement | null>(null);

  const holdCurrent = useCallback((element: HTMLLIElement | null) => {
    if (element !== null && element !== currentRef.current) {
      element.scrollIntoView({ block: 'center' });
    }

    currentRef.current = element;
  }, []);

  useEffect(() => {
    if (isOpen) {
      currentRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [isOpen]);

  const show = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <PopoverPanel
      tone="default"
      align="end"
      label={label}
      isOpen={isOpen}
      onOpenChange={show}
      trigger={<Icon of={isOpen ? ListOrderedFilledIcon : ListOrderedIcon} size={20} />}
      className="w-[min(22rem,calc(100vw-1.5rem))] p-1.5"
    >
      <span className="block px-2 pt-1.5 pb-2 text-xs font-medium text-text-muted">{label}</span>

      <ScrollFade className="max-h-[min(32rem,70vh)] pr-1">
        <div
          ref={containerRef}
          onPointerMove={follow}
          onPointerLeave={clear}
          onFocusCapture={follow}
          onBlurCapture={clear}
          className="relative"
        >
          <HoverHighlight rect={rect} radius="nested" />

          <ul className="relative flex flex-col gap-0.5">
            {entries.map((entry) => {
              const isCurrent = entry.id === currentId;

              return (
                <li key={entry.id} {...(isCurrent ? { ref: holdCurrent } : {})}>
                  <Button
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    aria-label={say('screens.readerContents.goToTitle', { title: entry.label })}
                    aria-current={isCurrent ? 'true' : undefined}
                    {...(isCurrent
                      ? { onPointerEnter: clear, onFocus: clear }
                      : { 'data-highlight': entry.id })}
                    onClick={() => {
                      show(false);
                      onSelect(entry.id);
                    }}
                    className={cn(
                      'flex w-full items-baseline gap-3 rounded-lg px-2 py-2.5 text-left outline-none focus-visible:focus-ring',
                      'transition-[background-color,scale,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'active:scale-[0.99] motion-reduce:transition-none',
                      isCurrent
                        ? 'bg-surface-raised'
                        : 'opacity-60 hover-hover:hover:opacity-100 focus-visible:opacity-100',
                    )}
                    style={{
                      paddingLeft: `${(0.5 + (entry.depth ?? 0) * INDENT_REM).toString()}rem`,
                    }}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm text-text',
                        isCurrent ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {entry.label}
                    </span>

                    {entry.detail === undefined ? null : (
                      <span className="shrink-0 text-xs tabular-nums text-text-muted">
                        {entry.detail}
                      </span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollFade>
    </PopoverPanel>
  );
};

ReaderContents.displayName = 'ReaderContents';

export { ReaderContents };
