import { cn } from '@ValenceUI/cn';
import { GROUP_LABEL } from '@ValenceUI/tokens/GROUP_LABEL';
import type { TableSectionProps } from './TableSection.types';

/**
 * One of several tables sharing a panel, under a small heading saying which part it holds.
 *
 * @param title - What this part holds.
 * @param children - The table.
 */
const TableSection = ({ title, children }: TableSectionProps) => (
  <section className="flex flex-col gap-2">
    <h3 className={cn('px-4 pt-3', GROUP_LABEL)}>{title}</h3>

    {children}
  </section>
);

TableSection.displayName = 'TableSection';

export { TableSection };
