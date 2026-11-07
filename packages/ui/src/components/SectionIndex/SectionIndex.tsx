import { useEffect, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { useSectionInView } from '@ValenceUI/useSectionInView';
import type { SectionIndexProps } from './SectionIndex.types';

/**
 * The sections of a long page listed down its side, the one being read marked as the page scrolls,
 * each taking the page to its section when pressed and staying marked until the page is scrolled
 * by hand, so a short last section the page cannot bring up to the top still reads as the one chosen — gliding there, or there at once for anybody
 * who has asked for less movement. A section can carry a short note, such as how many of its fields
 * have been changed, so the list says where to look as well as where things are.
 *
 * @param label - What the list is of, read out to anybody who cannot see it.
 * @param sections - Each section's element id, its name, and any note on it, in page order.
 * @param className - Extra classes for the caller's own layout, such as keeping it in view.
 */
const SectionIndex = ({ label, sections, className }: SectionIndexProps) => {
  const inView = useSectionInView(sections.map((section) => section.id));
  const [chosen, setChosen] = useState<string | null>(null);
  const isStill = useReducedMotionConfig() === true;
  const reading = chosen ?? inView;

  useEffect(() => {
    if (chosen === null) {
      return;
    }

    const letGo = () => {
      setChosen(null);
    };

    window.addEventListener('wheel', letGo, { once: true, passive: true });
    window.addEventListener('touchmove', letGo, { once: true, passive: true });
    window.addEventListener('keydown', letGo, { once: true });

    return () => {
      window.removeEventListener('wheel', letGo);
      window.removeEventListener('touchmove', letGo);
      window.removeEventListener('keydown', letGo);
    };
  }, [chosen]);

  return (
    <nav aria-label={label} className={cn('flex flex-col gap-0.5', className)}>
      {sections.map((section) => {
        const isReading = section.id === reading;

        return (
          <Button
            key={section.id}
            variant="bare"
            size="none"
            {...(isReading ? { 'aria-current': 'location' as const } : {})}
            onClick={() => {
              setChosen(section.id);
              document
                .getElementById(section.id)
                ?.scrollIntoView({ behavior: isStill ? 'auto' : 'smooth', block: 'start' });
            }}
            className={cn(
              'relative flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 pl-3 text-left text-[0.8125rem]',
              'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none',
              'before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:transition-colors',
              isReading
                ? 'font-medium text-text before:bg-text'
                : 'text-text-muted before:bg-transparent hover:text-text',
            )}
          >
            <span className="truncate">{section.label}</span>
            {section.note === undefined ? null : (
              <span className="shrink-0 text-xs tabular-nums text-text-muted">{section.note}</span>
            )}
          </Button>
        );
      })}
    </nav>
  );
};

SectionIndex.displayName = 'SectionIndex';

export { SectionIndex };
