import { cn } from '@ValenceUI/cn';
import type { PageTitleProps } from './PageTitle.types';

/**
 * The name of a page, written large at its top, the same on every page but the home page.
 *
 * @param children - The name.
 * @param className - Extra classes for the caller's own layout.
 */
const PageTitle = ({ children, className }: PageTitleProps) => (
  <h1 className={cn('text-3xl font-semibold tracking-tight text-text', className)}>{children}</h1>
);

PageTitle.displayName = 'PageTitle';

export { PageTitle };
