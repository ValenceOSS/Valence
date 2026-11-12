import { useState } from 'react';
import { CircleCheck as CircleCheckIcon, Copy as CopyIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { ServerFace } from '@ValenceScreens/components/ServerFace/ServerFace';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { say } from '@ValenceI18n/say';
import type { ServerCallingCardProps } from './ServerCallingCard.types';

/**
 * A server as it introduces itself: its face large on a wash of its colour, its name, where it is
 * and its fingerprint, with room for a few words of standing beside the address and controls at
 * the right.
 *
 * @param name - The server's name.
 * @param colour - Its colour.
 * @param picture - Where its picture is read from, or null.
 * @param address - Where it is reached.
 * @param fingerprint - Its fingerprint, ungrouped.
 * @param standing - Badges and words set beside the address.
 * @param children - Controls at the right.
 */
const ServerCallingCard = ({
  name,
  colour,
  picture,
  address,
  fingerprint,
  standing,
  children,
}: ServerCallingCardProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-5 px-5 py-6"
      style={{
        background: `linear-gradient(120deg, ${colour}33 0%, ${colour}0d 45%, transparent 75%)`,
      }}
    >
      <ServerFace
        name={name}
        colour={colour}
        picture={picture}
        pending={null}
        className="size-16 text-2xl shadow-[var(--shadow-lifted)]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-xl font-semibold tracking-tight text-text">{name}</span>
        <span className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-text-muted">
          <span className="truncate">{address}</span>
          {standing}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <code className="select-all font-mono">{groupFingerprint(fingerprint)}</code>
          <PanelCardInfo
            label={say('screens.adminArea.linkedServersPanel.aboutTheFingerprint')}
            align="start"
            detail={say('screens.adminArea.linkedServersPanel.bothAdminsCanCompareThis')}
          />
          <Button
            isIconOnly
            variant="ghost"
            size="xs"
            label={
              hasCopied
                ? say('common.copied')
                : say('screens.adminArea.linkedServersPanel.copyTheFingerprint')
            }
            onClick={() => {
              void navigator.clipboard.writeText(fingerprint).then(() => {
                setHasCopied(true);
              });
            }}
          >
            <Icon of={hasCopied ? CircleCheckIcon : CopyIcon} size={13} />
          </Button>
        </span>
      </div>

      {children === undefined ? null : <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

ServerCallingCard.displayName = 'ServerCallingCard';

export { ServerCallingCard };
