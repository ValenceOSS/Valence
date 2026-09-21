import { createElement } from 'react';
import { cn } from '@ValenceUI/cn';
import type { DocHeadingProps } from './DocHeading.types';

const LEVEL_CLASSES = {
  2: 'mt-14 border-b border-border pb-3 text-2xl font-semibold tracking-tight',
  3: 'mt-10 text-xl font-semibold tracking-tight',
  4: 'mt-8 text-base font-semibold',
} as const;

/**
 * Draws a heading in a page, with a link to itself that appears on hover so a section can be shared.
 *
 * @param level - How deep it sits.
 * @param id - The anchor the build gave it.
 * @param children - What it says.
 */
const DocHeading = ({ level, id, children }: DocHeadingProps) => {
  return createElement(
    `h${level.toString()}`,
    { id, className: cn('group scroll-mt-24 text-text', LEVEL_CLASSES[level]) },
    children,
    id === undefined ? null : (
      <a
        key="anchor"
        href={`#${id}`}
        aria-label="Link to this section"
        className="ml-2 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        #
      </a>
    ),
  );
};

DocHeading.displayName = 'DocHeading';

export { DocHeading };
