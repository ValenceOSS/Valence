import type { TableHTMLAttributes } from 'react';

/**
 * Draws a table from a page, scrolling sideways on its own when it is wider than the column.
 *
 * @param children - The head and body the build produced.
 */
const DocTable = ({ children }: TableHTMLAttributes<HTMLTableElement>) => (
  <div className="my-6 overflow-x-auto rounded-xl border border-border">
    <table className="w-full border-collapse text-left text-sm">{children}</table>
  </div>
);

DocTable.displayName = 'DocTable';

export { DocTable };
