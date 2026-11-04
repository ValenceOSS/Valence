import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link2Off as UnlinkFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { notify } from '@ValenceUI/notify';
import { ServerCallingCard } from '@ValenceScreens/components/AdminArea/components/LinkedServersPanel/components/ServerCallingCard/ServerCallingCard';
import { LinkedServerDetail } from '@ValenceScreens/components/AdminArea/components/LinkedServersPanel/components/LinkedServerDetail/LinkedServerDetail';
import { unlinkServer } from '@ValenceClient/admin/unlinkServer';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { LINK_STATE_NAMES } from '@ValenceClient/linking/LINK_STATE_NAMES';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { say } from '@ValenceI18n/say';
import type { LinkedServerPageProps } from './LinkedServerPage.types';

/**
 * One linked server on a page of its own: who it is and how the link stands, with unlinking in a
 * menu, then what each shares with the other, its people and the record between them.
 *
 * @param server - The linked server.
 * @param thisServer - What this server is called.
 * @param onBack - Goes back to the list.
 */
const LinkedServerPage = ({ server, thisServer, onBack }: LinkedServerPageProps) => {
  const cache = useQueryClient();
  const [isUnlinking, setIsUnlinking] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={say('screens.adminArea.linkedServersPanel.linkedServer')}
        isFlush
        actions={
          <Button variant="ghost" size="sm" onClick={onBack}>
            {say('screens.adminArea.linkedServersPanel.backToLinkedServers')}
          </Button>
        }
      >
        <ServerCallingCard
          name={server.name}
          colour={server.colour}
          picture={serverPictureUrl(server.id, server.pictureAt)}
          address={server.address}
          fingerprint={server.fingerprint}
          standing={
            <>
              <Badge tone="success" size="sm">
                {LINK_STATE_NAMES[server.state]}
              </Badge>
              {server.lastSeenAt === null ? null : (
                <span>
                  {say('screens.adminArea.linkedServersPanel.lastHeardFromWhen', {
                    when: saidWhen(server.lastSeenAt) ?? '',
                  })}
                </span>
              )}
            </>
          }
        >
          <ActionMenu
            label={say('common.actionsForName', { name: server.name })}
            groups={[
              {
                items: [
                  {
                    id: 'unlink',
                    label: say('screens.adminArea.linkedServersPanel.unlink'),
                    icon: <Icon of={UnlinkFilledIcon} size={15} />,
                    isDestructive: true,
                    onChoose: () => {
                      setIsUnlinking(true);
                    },
                  },
                ],
              },
            ]}
          />
        </ServerCallingCard>
      </PanelCard>

      <LinkedServerDetail server={server} thisServer={thisServer} />

      <ConfirmDialog
        title={say('screens.adminArea.linkedServersPanel.unlinkNameAsk', { name: server.name })}
        detail={say('screens.adminArea.linkedServersPanel.neitherServerReachesTheOther')}
        confirmLabel={say('screens.adminArea.linkedServersPanel.unlink')}
        isDestructive
        isOpen={isUnlinking}
        onClose={() => {
          setIsUnlinking(false);
        }}
        onConfirm={() => {
          void unlinkServer(server.id).then(async (refusal) => {
            if (refusal === null) {
              notify.worked(
                say('screens.adminArea.linkedServersPanel.unlinkedName', { name: server.name }),
              );
              onBack();
            } else {
              notify.failed(refusal.message);
            }

            await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
          });
          setIsUnlinking(false);
        }}
      />
    </div>
  );
};

LinkedServerPage.displayName = 'LinkedServerPage';

export { LinkedServerPage };
