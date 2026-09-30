import { useState } from 'react';
import { IconCheckFilled, IconCopyFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import type { CopyableCommandsProps } from './CopyableCommands.types';

const COPIED_FOR_MILLISECONDS = 1600;

/**
 * A few lines to paste into a terminal, set as a terminal sets them and copied whole in one press.
 *
 * @param commands - The lines, one command to each.
 * @param label - What the lines do, said to anybody who cannot see them.
 */
const CopyableCommands = ({ commands, label }: CopyableCommandsProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(commands).then(() => {
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, COPIED_FOR_MILLISECONDS);
    });
  };

  return (
    <figure
      aria-label={label}
      className="overflow-hidden rounded-xl border border-border/60 bg-surface"
    >
      <figcaption className="flex items-center justify-between border-b border-border/60 px-4 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-text-muted">Terminal</span>

        <Button
          variant="ghost"
          size="xs"
          label={isCopied ? 'Copied' : 'Copy the commands'}
          onClick={copy}
        >
          {isCopied ? <IconCheckFilled size={14} /> : <IconCopyFilled size={14} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </Button>
      </figcaption>

      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-text sm:text-[0.8rem]">
        {commands.split('\n').map((line) => (
          <span key={line} className="block">
            <span aria-hidden className="select-none text-text-muted/60">
              ${' '}
            </span>
            {line}
          </span>
        ))}
      </pre>
    </figure>
  );
};

CopyableCommands.displayName = 'CopyableCommands';

export { CopyableCommands };
