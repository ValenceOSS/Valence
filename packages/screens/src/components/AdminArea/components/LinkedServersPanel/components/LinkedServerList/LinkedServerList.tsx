import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { notify } from '@ValenceUI/notify';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { answerLinkedServer } from '@ValenceClient/admin/answerLinkedServer';
import { unlinkServer } from '@ValenceClient/admin/unlinkServer';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { LINK_STATE_NAMES } from '@ValenceClient/linking/LINK_STATE_NAMES';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { LinkState, LinkedServer } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkedServerListProps } from './LinkedServerList.types';
import { say } from '@ValenceI18n/say';

const AN_INITIAL = { kind: 'initial', font: 'gilroy' } as const;

const STATE_TONES: Readonly<Record<LinkState, BadgeTone>> = {
  awaitingThem: 'waiting',
  awaitingUs: 'warning',
  linked: 'success',
  refused: 'danger',
  unlinkedByThem: 'quiet',
};

/**
 * The servers this one is linked with, or on the way to being: each by its name and colour, where
 * it is, its fingerprint, how things stand and when it last answered, with what can be done about
 * it — approving or refusing a server asking to link, asking again after one this server is waiting
 * on, unlinking, or forgetting one that refused or unlinked. Unlinking is asked about first.
 *
 * @param servers - The servers.
 */
const LinkedServerList = ({ servers }: LinkedServerListProps) => {
  const cache = useQueryClient();
  const [unlinking, setUnlinking] = useState<LinkedServer | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const reread = () => cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });

  const answer = (server: LinkedServer, what: 'approve' | 'refuse' | 'check') => {
    setWorking(server.id);

    void answerLinkedServer(server.id, what)
      .then(async (sent) => {
        if (sent.refusal !== null) {
          notify.failed(sent.refusal.message);
        } else if (sent.value?.state === 'linked' && server.state !== 'linked') {
          notify.worked(
            say('screens.adminArea.linkedServersPanel.linkedWithName', { name: server.name }),
          );
        }

        await reread();
      })
      .finally(() => {
        setWorking(null);
      });
  };

  const forget = (server: LinkedServer) => {
    setWorking(server.id);

    void unlinkServer(server.id)
      .then(async (refusal) => {
        if (refusal === null) {
          notify.worked(
            say('screens.adminArea.linkedServersPanel.unlinkedName', { name: server.name }),
          );
        } else {
          notify.failed(refusal.message);
        }

        await reread();
      })
      .finally(() => {
        setWorking(null);
        setUnlinking(null);
      });
  };

  return (
    <PanelCard title={say('common.linkedServers')} isFlush>
      <ConfirmDialog
        title={say('screens.adminArea.linkedServersPanel.unlinkNameAsk', {
          name: unlinking?.name ?? '',
        })}
        detail={say('screens.adminArea.linkedServersPanel.neitherServerReachesTheOther')}
        confirmLabel={say('screens.adminArea.linkedServersPanel.unlink')}
        isDestructive
        isBusy={unlinking !== null && working === unlinking.id}
        isOpen={unlinking !== null}
        onClose={() => {
          setUnlinking(null);
        }}
        onConfirm={() => {
          if (unlinking !== null) {
            forget(unlinking);
          }
        }}
      />

      {servers.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-muted">
          {say('screens.adminArea.linkedServersPanel.noServersAreLinkedYet')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {servers.map((server) => {
            const isWorking = working === server.id;
            const lastHeard = server.lastSeenAt === null ? null : saidWhen(server.lastSeenAt);

            return (
              <li key={server.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <FaceCircle
                  name={server.name}
                  colour={server.colour}
                  avatar={AN_INITIAL}
                  source=""
                  className="size-9 text-sm"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{server.name}</span>
                    <Badge size="sm" tone={STATE_TONES[server.state]}>
                      {LINK_STATE_NAMES[server.state]}
                    </Badge>
                  </div>
                  <span className="truncate text-xs text-text-muted">{server.address}</span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {groupFingerprint(server.fingerprint)}
                  </span>
                  {lastHeard === null ? null : (
                    <span className="text-xs text-text-muted">
                      {say('screens.adminArea.linkedServersPanel.lastHeardFromWhen', {
                        when: lastHeard,
                      })}
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  {server.state === 'awaitingUs' ? (
                    <>
                      <Button
                        variant="glossy"
                        size="sm"
                        isLoading={isWorking}
                        onClick={() => {
                          answer(server, 'approve');
                        }}
                      >
                        {say('common.approve')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isWorking}
                        onClick={() => {
                          answer(server, 'refuse');
                        }}
                      >
                        {say('common.refuse')}
                      </Button>
                    </>
                  ) : null}

                  {server.state === 'awaitingThem' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={isWorking}
                      onClick={() => {
                        answer(server, 'check');
                      }}
                    >
                      {say('screens.adminArea.linkedServersPanel.checkAgain')}
                    </Button>
                  ) : null}

                  {server.state === 'refused' || server.state === 'unlinkedByThem' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={isWorking}
                      onClick={() => {
                        forget(server);
                      }}
                    >
                      {say('common.forget')}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isWorking}
                      onClick={() => {
                        setUnlinking(server);
                      }}
                    >
                      {say('screens.adminArea.linkedServersPanel.unlink')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
};

LinkedServerList.displayName = 'LinkedServerList';

export { LinkedServerList };
