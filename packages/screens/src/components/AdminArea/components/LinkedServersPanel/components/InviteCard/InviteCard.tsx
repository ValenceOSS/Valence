import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinIcon,
  CircleCheck as CircleCheckIcon,
  Copy as CopyIcon,
  Plus as PlusFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { makeLinkInvite } from '@ValenceClient/admin/makeLinkInvite';
import { withdrawLinkInvite } from '@ValenceClient/admin/withdrawLinkInvite';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { InviteCardProps } from './InviteCard.types';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { say } from '@ValenceI18n/say';

/**
 * Inviting another Valence to link with this one: making an invite, shown the once it is made, to
 * copy and send to the other server's admin, and the invites still open, each to withdraw.
 *
 * @param invites - The invites still open.
 */
const InviteCard = ({ invites }: InviteCardProps) => {
  const cache = useQueryClient();
  const [made, setMade] = useState<string | null>(null);
  const [isMaking, setIsMaking] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const reread = () => cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });

  const make = () => {
    setIsMaking(true);
    setHasCopied(false);

    void makeLinkInvite()
      .then(async (sent) => {
        if (sent.value === null) {
          notify.failed(sent.refusal?.message ?? '');

          return;
        }

        setMade(sent.value.invite);
        await reread();
      })
      .finally(() => {
        setIsMaking(false);
      });
  };

  useAdminCommand('makeInvite', () => {
    void make();
  });

  return (
    <PanelCard
      title={say('screens.adminArea.linkedServersPanel.inviteAServer')}
      actions={
        <PanelCardAction icon={PlusFilledIcon} isLoading={isMaking} onClick={make}>
          {say('screens.adminArea.linkedServersPanel.makeAnInvite')}
        </PanelCardAction>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-text-muted">
          {say('screens.adminArea.linkedServersPanel.anInviteLinksOneServer')}
        </p>

        {made === null ? null : (
          <div className="flex flex-col gap-2">
            <code
              aria-label={say('screens.adminArea.linkedServersPanel.theInvite')}
              className="select-all break-all rounded-md bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs"
            >
              {made}
            </code>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">
                {say('screens.adminArea.linkedServersPanel.copyItNowItIsNotShownAgain')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(made).then(
                    () => {
                      setHasCopied(true);
                    },
                    () => {
                      notify.failed(
                        say('screens.adminArea.linkedServersPanel.theInviteCouldNotBeCopied'),
                      );
                    },
                  );
                }}
              >
                <Icon of={hasCopied ? CircleCheckIcon : CopyIcon} size={14} />
                {hasCopied ? say('common.copied') : say('common.copy')}
              </Button>
            </div>
          </div>
        )}

        {invites.length === 0 ? null : (
          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-2 py-2">
                <span className="text-xs text-text-muted">
                  {say('screens.adminArea.linkedServersPanel.runsOutWhen', {
                    when: saidWhen(invite.expiresAt) ?? '',
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  label={say('screens.adminArea.linkedServersPanel.withdrawTheInvite', {
                    when: saidWhen(invite.createdAt) ?? '',
                  })}
                  onClick={() => {
                    void withdrawLinkInvite(invite.id).then(async (refusal) => {
                      if (refusal !== null) {
                        notify.failed(refusal.message);
                      }

                      await reread();
                    });
                  }}
                >
                  <Icon of={BinIcon} size={14} />
                  {say('common.withdraw')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelCard>
  );
};

InviteCard.displayName = 'InviteCard';

export { InviteCard };
