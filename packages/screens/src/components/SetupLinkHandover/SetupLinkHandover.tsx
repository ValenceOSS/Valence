import { Mail as MailIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { QrCode } from '@ValenceUI/QrCode';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { say } from '@ValenceI18n/say';
import type { SetupLinkHandoverProps } from './SetupLinkHandover.types';

/**
 * Hands a setup link over: as a code to scan, as an address to copy, and, where the server sends
 * them, by email — with when it stops working and that Valence keeps no copy of it, so nobody looks
 * for it again later.
 *
 * @param link - The link and when it stops working.
 * @param name - Whose link it is.
 * @param onEmail - Sends it by email, where this server can and the account has an address.
 * @param isEmailing - Whether it is being sent.
 */
const SetupLinkHandover = ({ link, name, onEmail, isEmailing = false }: SetupLinkHandoverProps) => {
  const until = saidWhen(link.expiresAt) ?? link.expiresAt;

  return (
    <div className="flex flex-col items-center gap-4">
      <QrCode
        value={link.url}
        label={say('screens.setupLinkHandover.aCodeThatOpensNamesSetupLink', { name })}
        size={168}
      />

      <div className="w-full">
        <CopyableAddress
          title={say('screens.setupLinkHandover.setupLinkForName', { name })}
          detail={say('screens.setupLinkHandover.worksOnceUntilValenceKeepsNoCopy', { until })}
          address={link.url}
        />
      </div>

      {onEmail === undefined ? null : (
        <Button variant="secondary" size="sm" isLoading={isEmailing} onClick={onEmail}>
          <Icon of={MailIcon} size={15} />
          {say('screens.setupLinkHandover.sendByEmail')}
        </Button>
      )}
    </div>
  );
};

SetupLinkHandover.displayName = 'SetupLinkHandover';

export { SetupLinkHandover };
