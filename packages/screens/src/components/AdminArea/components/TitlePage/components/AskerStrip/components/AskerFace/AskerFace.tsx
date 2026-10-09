import { cn } from '@ValenceUI/cn';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import type { AskerFaceProps } from './AskerFace.types';

/**
 * The face of somebody who asked for a title: their account's, or their initial where they have no
 * account here, such as an asker brought over from Seerr.
 *
 * @param asker - Who asked.
 * @param accounts - The accounts on this server.
 * @param size - How large to draw it.
 */
const AskerFace = ({ asker, accounts, size }: AskerFaceProps) => {
  const account = accounts.find((one) => one.id === asker.id);

  return (
    <span
      className={cn(
        'flex shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--card-face)]',
        size === 'sm' ? 'size-6 [&>*]:size-6' : 'size-8',
      )}
    >
      {account === undefined ? (
        <span
          className={cn(
            'flex size-full items-center justify-center rounded-full bg-subtle font-semibold text-text',
            size === 'sm' ? 'text-[0.625rem]' : 'text-sm',
          )}
        >
          {(asker.name.trim()[0] ?? '?').toUpperCase()}
        </span>
      ) : (
        <AccountFace account={account} />
      )}
    </span>
  );
};

AskerFace.displayName = 'AskerFace';

export { AskerFace };
