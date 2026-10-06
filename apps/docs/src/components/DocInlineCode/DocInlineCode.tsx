import { Badge } from '@ValenceUI/Badge';
import type { HTMLAttributes } from 'react';

/**
 * Draws a piece of code inside a sentence as a badge, and leaves the code inside a block to the
 * block.
 *
 * @param className - The class the build gave code it highlighted, which marks it as a block's.
 * @param children - The code.
 */
const DocInlineCode = ({ className, children }: HTMLAttributes<HTMLElement>) =>
  className === undefined ? (
    <Badge tone="quiet" className="mx-0.5 align-baseline">
      <code className="font-mono text-[0.95em]">{children}</code>
    </Badge>
  ) : (
    <code className={className}>{children}</code>
  );

DocInlineCode.displayName = 'DocInlineCode';

export { DocInlineCode };
