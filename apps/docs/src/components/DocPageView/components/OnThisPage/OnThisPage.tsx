import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import { useActiveHeading } from '@ValenceDocs/components/DocPageView/components/OnThisPage/useActiveHeading';
import type { PageHeading } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

type OnThisPageProps = {
  headings: readonly PageHeading[];
};

/**
 * The list of a page's sections, down the right of a wide screen, each linking to its heading.
 *
 * @param headings - The page's headings.
 */
const OnThisPage = ({ headings }: OnThisPageProps) => {
  const active = useActiveHeading(headings);
  const prefersReducedMotion = useReducedMotionConfig();

  return headings.length < 2 ? null : (
    <nav
      aria-label="On this page"
      className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] w-56 shrink-0 self-start overflow-y-auto xl:block"
    >
      <p className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        On this page
      </p>

      <motion.ul
        key={headings.map((heading) => heading.id).join()}
        initial="hidden"
        animate="shown"
        variants={groupVariants}
        className="flex flex-col gap-1.5 border-l border-border"
      >
        {headings.map((heading, index) => (
          <RevealItem key={heading.id} index={index} className="relative list-none">
            <a
              href={`#${heading.id}`}
              aria-current={heading.id === active ? 'location' : undefined}
              className={cn(
                'block py-0.5 text-sm transition-colors duration-200',
                heading.level === 2 ? 'pl-3' : 'pl-6',
                heading.id === active
                  ? 'font-medium text-accent'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {heading.text}
            </a>

            {heading.id === active ? (
              <motion.span
                aria-hidden
                layoutId="on-this-page-marker"
                transition={
                  prefersReducedMotion === true
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 38 }
                }
                className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-accent"
              />
            ) : null}
          </RevealItem>
        ))}
      </motion.ul>
    </nav>
  );
};

OnThisPage.displayName = 'OnThisPage';

export type { OnThisPageProps };

export { OnThisPage };
