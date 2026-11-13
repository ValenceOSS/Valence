import { useState } from 'react';
import { Check as CheckIcon, Type as TypeIcon } from '@keyline-icons/react';
import { Type as TypeFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { ScrollFade } from '@ValenceUI/ScrollFade';
import { cn } from '@ValenceUI/cn';
import { READING_THEME_IDS } from '@ValenceCore/tokens/READING_THEME_IDS';
import { READING_THEMES } from '@ValenceCore/tokens/READING_THEMES';
import { nameReadingTheme } from '@ValenceClient/books/nameReadingTheme';
import { READER_SERIF } from '@ValenceScreens/reading/READER_SERIF';
import type { ReadingLookProps } from './ReadingLook.types';
import { say } from '@ValenceI18n/say';

/**
 * How a book looks while it is read, as the phone lays it out: the words smaller or larger as a
 * pair of buttons, the themes as swatches each showing its own page and type with the one in use
 * ticked, and beneath them whatever else the reader lets somebody change.
 *
 * @param theme - The theme in use.
 * @param onTheme - Told a theme was chosen.
 * @param onSmaller - Makes the words smaller, where they can be.
 * @param onLarger - Makes the words larger, where they can be.
 * @param onOpenChange - Told when it opens or closes, so the reader can keep its bars up meanwhile.
 * @param children - The rest of the reader's settings.
 */
const ReadingLook = ({
  theme,
  onTheme,
  onSmaller,
  onLarger,
  onOpenChange,
  children,
}: ReadingLookProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const show = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  return (
    <PopoverPanel
      tone="default"
      align="end"
      label={say('screens.readingLook.textAndPage')}
      isOpen={isOpen}
      onOpenChange={show}
      trigger={<Icon of={isOpen ? TypeFilledIcon : TypeIcon} size={20} />}
      className="w-[min(23rem,calc(100vw-1.5rem))] p-0"
    >
      <ScrollFade className="max-h-[min(40rem,80vh)]">
        <div className="flex flex-col gap-5 p-4">
          <div className="flex h-11 overflow-hidden rounded-xl bg-surface-raised">
            <Button
              variant="ghost"
              size="none"
              label={say('phone.aReader.aReadingLook.smallerText')}
              disabled={onSmaller === null}
              onClick={() => {
                onSmaller?.();
              }}
              className="flex-1 text-sm"
            >
              <span style={{ fontFamily: READER_SERIF }}>
                {say('phone.aReader.aReadingLook.letter')}
              </span>
            </Button>
            <span aria-hidden className="my-2.5 w-px bg-line" />
            <Button
              variant="ghost"
              size="none"
              label={say('phone.aReader.aReadingLook.largerText')}
              disabled={onLarger === null}
              onClick={() => {
                onLarger?.();
              }}
              className="flex-1 text-xl"
            >
              <span style={{ fontFamily: READER_SERIF }}>
                {say('phone.aReader.aReadingLook.letter')}
              </span>
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-medium text-text-muted">
              {say('phone.aReader.aReadingLook.themes')}
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              {READING_THEME_IDS.map((id) => {
                const look = READING_THEMES[id];
                const isChosen = id === theme;

                return (
                  <Button
                    key={id}
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    label={say('phone.aReader.aReadingLook.useNameTheme', {
                      name: nameReadingTheme(id),
                    })}
                    aria-pressed={isChosen}
                    onClick={() => {
                      onTheme(id);
                    }}
                    className="group/theme flex flex-col items-stretch gap-1.5 rounded-xl outline-none focus-visible:focus-ring"
                  >
                    <span
                      className={cn(
                        'relative grid h-16 place-items-center rounded-xl transition-[box-shadow,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                        'group-active/theme:scale-[0.97] motion-reduce:transition-none',
                        isChosen
                          ? 'ring-2 ring-text'
                          : 'ring-1 ring-line hover-hover:group-hover/theme:ring-text/40',
                      )}
                      style={{ backgroundColor: look.paper, color: look.ink }}
                    >
                      <span
                        className={cn('text-2xl', look.isBold ? 'font-bold' : 'font-normal')}
                        style={{ fontFamily: READER_SERIF }}
                      >
                        {say('phone.aReader.aReadingLook.sample')}
                      </span>

                      {isChosen ? (
                        <span className="absolute top-1.5 end-1.5 grid size-5 place-items-center rounded-full bg-shade/60 text-on-scrim">
                          <Icon of={CheckIcon} size={12} />
                        </span>
                      ) : null}
                    </span>

                    <span
                      className={cn(
                        'truncate text-center text-xs',
                        isChosen ? 'font-medium text-text' : 'text-text-muted',
                      )}
                    >
                      {nameReadingTheme(id)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {children === undefined ? null : (
          <div className="border-t border-[var(--surface-line)] pb-2">{children}</div>
        )}
      </ScrollFade>
    </PopoverPanel>
  );
};

ReadingLook.displayName = 'ReadingLook';

export { ReadingLook };
