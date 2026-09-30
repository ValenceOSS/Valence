import { CircleCheck as CircleCheckIcon, Copy as CopyIcon } from '@keyline-icons/react';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { CopyableAddressProps } from './CopyableAddress.types';
import { say } from '@ValenceI18n/say';

/**
 * An address an administrator hands to an outside service, with what it is for and a way to copy
 * it exactly.
 *
 * @param title - What the address is.
 * @param detail - Where to give it.
 * @param address - The address.
 */
const CopyableAddress = ({ title, detail, address }: CopyableAddressProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-surface-raised/40 p-3">
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-text-muted">{detail}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{address}</code>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(address).then(() => {
              setHasCopied(true);
            });
          }}
        >
          {hasCopied ? say('common.copied') : say('common.copy')}
          <Icon of={hasCopied ? CircleCheckIcon : CopyIcon} size={14} />
        </Button>
      </div>
    </div>
  );
};

CopyableAddress.displayName = 'CopyableAddress';

export { CopyableAddress };
