import type { TableSectionProps } from './TableSection.types';

/**
 * One of several tables sharing a panel, under a small heading saying which part it holds.
 *
 * @param title - What this part holds.
 * @param children - The table.
 */
const TableSection = ({ title, children }: TableSectionProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="px-4 pt-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-text-muted">
      {title}
    </h3>

    {children}
  </section>
);

TableSection.displayName = 'TableSection';

export { TableSection };
