import { isValidElement, useRef, useState } from 'react';
import { Check as CheckIcon, Copy as CopyIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { HTMLAttributes } from 'react';

const COPIED_FOR_MILLISECONDS = 1600;

/**
 * Draws a block of code: highlighted, labelled with its language, and copyable in one press.
 *
 * @param children - The `code` element the build produced, carrying its language as a class.
 */
const DocCode = ({ children }: HTMLAttributes<HTMLPreElement>) => {
  const block = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const language = isValidElement<{ className?: string }>(children)
    ? /language-(?<name>[\w-]+)/u.exec(children.props.className ?? '')?.groups?.name
    : undefined;

  const copy = () => {
    void navigator.clipboard.writeText(block.current?.textContent ?? '').then(() => {
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, COPIED_FOR_MILLISECONDS);
    });
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
          {language ?? 'text'}
        </span>

        <Button variant="ghost" size="xs" label={isCopied ? 'Copied' : 'Copy code'} onClick={copy}>
          <Icon of={isCopied ? CheckIcon : CopyIcon} size={14} />
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>

      <pre ref={block} className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  );
};

DocCode.displayName = 'DocCode';

export { DocCode };
