import type { HTMLAttributes } from 'react';

/**
 * Draws a piece of code inside a sentence, and leaves the code inside a block to the block.
 *
 * @param className - The class the build gave code it highlighted, which marks it as a block's.
 * @param children - The code.
 */
const DocInlineCode = ({ className, children }: HTMLAttributes<HTMLElement>) =>
  className === undefined ? (
    <code className="rounded-md bg-surface-raised px-1.5 py-0.5 font-mono text-[0.9em] text-text">
      {children}
    </code>
  ) : (
    <code className={className}>{children}</code>
  );

DocInlineCode.displayName = 'DocInlineCode';

export { DocInlineCode };
