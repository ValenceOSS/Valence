import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Link as LinkFilledIcon,
  Plus as PlusFilledIcon,
  Server as EmptyServerIcon,
  X as XIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useAdminCommand } from '@ValenceScreens/admin/useAdminCommand';
import { ServerFace } from '@ValenceScreens/components/ServerFace/ServerFace';
import { answerLinkedServer } from '@ValenceClient/admin/answerLinkedServer';
import { linkWithInvite } from '@ValenceClient/admin/linkWithInvite';
import { makeLinkInvite } from '@ValenceClient/admin/makeLinkInvite';
import { unlinkServer } from '@ValenceClient/admin/unlinkServer';
import { withdrawLinkInvite } from '@ValenceClient/admin/withdrawLinkInvite';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { groupFingerprint } from '@ValenceClient/linking/groupFingerprint';
import { LINK_STATE_NAMES } from '@ValenceClient/linking/LINK_STATE_NAMES';
import { serverPictureUrl } from '@ValenceClient/linking/serverPictureUrl';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { say } from '@ValenceI18n/say';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LinkState, LinkedServer } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkedServerListProps } from './LinkedServerList.types';

const STATE_TONES: Readonly<Record<LinkState, BadgeTone>> = {
  awaitingThem: 'waiting',
  awaitingUs: 'warning',
  linked: 'success',
  refused: 'danger',
  unlinkedByThem: 'quiet',
  unlinked: 'quiet',
};

/**
 * The servers this one is linked with or on the way to being, as a table that opens each linked
 * one onto its own page, a server still to answer showing its fingerprint so it can be checked; the
 * invites still open beneath it; and making an invite or using one sent from another server, each in
 * a small dialog.
 *
 * @param servers - The servers.
 * @param invites - The invites still open.
 * @param onOpen - Opens a linked server's page.
 */
const LinkedServerList = ({ servers, invites, onOpen }: LinkedServerListProps) => {
  const cache = useQueryClient();
  const [forgetting, setForgetting] = useState<LinkedServer | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [made, setMade] = useState<string | null>(null);
  const [isMaking, setIsMaking] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const [invite, setInvite] = useState('');
  const [isLinking, setIsLinking] = useState(false);
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

  useAdminCommand('makeInvite', make);

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

  const cancel = (server: LinkedServer) => {
    setWorking(server.id);

    void unlinkServer(server.id)
      .then(async (refusal) => {
        if (refusal !== null) {
          notify.failed(refusal.message);
        }

        await reread();
      })
      .finally(() => {
        setWorking(null);
      });
  };

  const columns: DataTableColumn<LinkedServer>[] = [
    {
      id: 'server',
      header: say('common.server'),
      accessorFn: (server) => server.name,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-3.5 py-2.5">
          <ServerFace
            name={row.original.name}
            colour={row.original.colour}
            picture={serverPictureUrl(row.original.id, row.original.pictureAt)}
            className="size-10 text-sm"
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[0.9375rem] font-medium text-text">
              {row.original.name}
            </span>
            <span className="max-w-[28rem] truncate text-xs text-text-muted">
              {row.original.address}
            </span>
            {row.original.state === 'awaitingThem' || row.original.state === 'awaitingUs' ? (
              <code className="max-w-[28rem] truncate font-mono text-xs text-text-muted">
                {groupFingerprint(row.original.fingerprint)}
              </code>
            ) : null}
          </span>
        </span>
      ),
    },
    {
      id: 'state',
      header: say('common.status'),
      accessorFn: (server) => LINK_STATE_NAMES[server.state],
      cell: ({ row }) => (
        <Badge tone={STATE_TONES[row.original.state]}>{LINK_STATE_NAMES[row.original.state]}</Badge>
      ),
    },
    {
      id: 'heard',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.linkedServersPanel.lastHeardFrom'),
      accessorFn: (server) => server.lastSeenAt ?? '',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {row.original.lastSeenAt === null ? '—' : (saidWhen(row.original.lastSeenAt) ?? '—')}
        </span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const server = row.original;
        const isWorking = working === server.id;

        return (
          <span
            className="flex justify-end gap-1"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {server.state === 'awaitingUs' ? (
              <>
                <Button
                  variant="confirm"
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
                {say('screens.importWizard.arrImportStep.readItAgain')}
              </Button>
            ) : null}
            {server.state === 'awaitingThem' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isWorking}
                onClick={() => {
                  cancel(server);
                }}
              >
                {say('common.cancel')}
              </Button>
            ) : null}
            {server.state === 'refused' ||
            server.state === 'unlinkedByThem' ||
            server.state === 'unlinked' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForgetting(server);
                }}
              >
                {say('common.forget')}
              </Button>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <PanelCard
      title={say('common.linkedServers')}
      isFlush
      actions={
        <>
          <PanelCardAction
            icon={LinkFilledIcon}
            onClick={() => {
              setIsUsing(true);
            }}
          >
            {say('screens.adminArea.linkedServersPanel.useAnInvite')}
          </PanelCardAction>
          <PanelCardAction icon={PlusFilledIcon} isLoading={isMaking} onClick={make}>
            {say('screens.adminArea.linkedServersPanel.makeAnInvite')}
          </PanelCardAction>
        </>
      }
    >
      {servers.length === 0 ? (
        <div className="flex flex-col gap-5 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-text-muted">
              <Icon of={EmptyServerIcon} size={18} />
            </span>
            <span className="flex flex-col">
              <span className="text-[0.9375rem] font-medium text-text">
                {say('screens.adminArea.linkedServersPanel.noServersAreLinkedYetHeading')}
              </span>
              <span className="text-[0.8125rem] text-text-muted">
                {say('screens.adminArea.linkedServersPanel.linkingLetsTwoValenceServersShare')}
              </span>
            </span>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: say('screens.adminArea.linkedServersPanel.createAnInvite'),
                text: say('screens.adminArea.linkedServersPanel.makeOneHereAndSendIt'),
                action: (
                  <Button variant="secondary" size="sm" isLoading={isMaking} onClick={make}>
                    <Icon of={PlusFilledIcon} size={14} />
                    {say('screens.adminArea.linkedServersPanel.makeAnInvite')}
                  </Button>
                ),
              },
              {
                title: say('screens.adminArea.linkedServersPanel.theyUseIt'),
                text: say('screens.adminArea.linkedServersPanel.theirAdminPastesItIntoUse'),
                action: null,
              },
              {
                title: say('screens.adminArea.linkedServersPanel.youApproveThem'),
                text: say('screens.adminArea.linkedServersPanel.theyShowUpHereToApprove'),
                action: null,
              },
            ].map((step, at) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-lg border border-[var(--surface-line)] p-4"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--surface-hover)] text-xs font-semibold tabular-nums text-text">
                    {at + 1}
                  </span>
                  <span className="text-[0.8125rem] font-medium text-text">{step.title}</span>
                </span>
                <span className="text-xs leading-relaxed text-text-muted">{step.text}</span>
                {step.action === null ? null : <span className="mt-1">{step.action}</span>}
              </li>
            ))}
          </ol>
          <span className="text-xs text-text-muted">
            {say('screens.adminArea.linkedServersPanel.sentAnInviteBySomeoneElse')}{' '}
            <Button
              variant="link"
              size="none"
              className="inline text-xs text-text underline"
              onClick={() => {
                setIsUsing(true);
              }}
            >
              {say('screens.adminArea.linkedServersPanel.useItHere')}
            </Button>
          </span>
        </div>
      ) : (
        <DataTable
          label={say('common.linkedServers')}
          columns={columns}
          rows={[...servers]}
          getRowId={(server) => server.id}
          onChooseRow={(server) => {
            if (server.state === 'linked') {
              onOpen(server.id);
            }
          }}
        />
      )}

      {invites.length === 0 ? null : (
        <div className="border-t border-[var(--surface-line)]">
          <h3 className="px-5 pt-3 text-xs font-medium text-text-muted">
            {say('screens.adminArea.linkedServersPanel.openInvites')}
          </h3>
          <ul className="flex flex-col divide-y divide-[var(--surface-line)] px-5">
            {invites.map((one) => (
              <li key={one.id} className="flex items-center justify-between gap-2 py-2.5">
                <span className="text-[0.8125rem] text-text">
                  {say('screens.adminArea.linkedServersPanel.madeWhen', {
                    when: saidWhen(one.createdAt) ?? '',
                  })}
                  <span className="text-text-muted">
                    {' · '}
                    {say('screens.adminArea.linkedServersPanel.runsOutWhen', {
                      when: saidWhen(one.expiresAt) ?? '',
                    })}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void withdrawLinkInvite(one.id).then(async (refusal) => {
                      if (refusal !== null) {
                        notify.failed(refusal.message);
                      }

                      await reread();
                    });
                  }}
                >
                  {say('common.withdraw')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        label={say('screens.adminArea.linkedServersPanel.inviteAServer')}
        isOpen={made !== null}
        onClose={() => {
          setMade(null);
        }}
      >
        <DialogTitle title={say('screens.adminArea.linkedServersPanel.inviteAServer')}>
          <Button
            isIconOnly
            variant="ghost"
            label={say('common.close')}
            size="sm"
            onClick={() => {
              setMade(null);
            }}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-3">
            <p className="text-[0.8125rem] text-text-muted">
              {say('screens.adminArea.linkedServersPanel.sendThisToTheOtherServers')}
            </p>
            <code className="select-all break-all rounded-lg bg-[var(--surface-hover)] px-3 py-2.5 font-mono text-xs text-text">
              {made}
            </code>
            <span className="text-xs text-text-muted">
              {say('screens.adminArea.linkedServersPanel.copyItNowItIsNotShownAgain')}
            </span>
          </div>
        </DialogContent>
        <DialogFooter
          dismiss={{
            label: say('common.close'),
            onChoose: () => {
              setMade(null);
            },
          }}
          confirm={{
            label: hasCopied ? say('common.copied') : say('common.copy'),
            onChoose: () => {
              void navigator.clipboard.writeText(made ?? '').then(() => {
                setHasCopied(true);
              });
            },
          }}
        />
      </Dialog>

      <Dialog
        label={say('screens.adminArea.linkedServersPanel.useAnInvite')}
        isOpen={isUsing}
        onClose={() => {
          setIsUsing(false);
        }}
      >
        <DialogTitle title={say('screens.adminArea.linkedServersPanel.useAnInvite')}>
          <Button
            isIconOnly
            variant="ghost"
            label={say('common.close')}
            size="sm"
            onClick={() => {
              setIsUsing(false);
            }}
          >
            <Icon of={XIcon} size={16} />
          </Button>
        </DialogTitle>
        <Form
          label={say('screens.adminArea.linkedServersPanel.useAnInvite')}
          isDialog
          onSubmit={(event) => {
            event.preventDefault();
            setIsLinking(true);

            void linkWithInvite(invite.trim())
              .then(async (sent) => {
                if (sent.value === null) {
                  notify.failed(sent.refusal?.message ?? '');

                  return;
                }

                notify.worked(
                  sent.value.state === 'linked'
                    ? say('screens.adminArea.linkedServersPanel.linkedWithName', {
                        name: sent.value.name,
                      })
                    : say('screens.adminArea.linkedServersPanel.askedNameToLink', {
                        name: sent.value.name,
                      }),
                );
                setInvite('');
                setIsUsing(false);
                await reread();
              })
              .finally(() => {
                setIsLinking(false);
              });
          }}
        >
          <DialogContent>
            <TextField
              label={say('screens.adminArea.linkedServersPanel.theirInvite')}
              value={invite}
              onValueChange={setInvite}
              autoComplete="off"
              description={say('screens.adminArea.linkedServersPanel.pasteAnInvite')}
            />
          </DialogContent>
          <DialogFooter
            dismiss={{
              onChoose: () => {
                setIsUsing(false);
              },
            }}
            confirm={{
              label: say('screens.adminArea.linkedServersPanel.link'),
              isSubmit: true,
              isLoading: isLinking,
            }}
          />
        </Form>
      </Dialog>

      <ConfirmDialog
        title={say('common.removeName', { name: forgetting?.name ?? '' })}
        detail={say('screens.adminArea.linkedServersPanel.everythingKeptFromNameGoes', {
          name: forgetting?.name ?? '',
        })}
        confirmLabel={say('common.forget')}
        isDestructive
        isOpen={forgetting !== null}
        onClose={() => {
          setForgetting(null);
        }}
        onConfirm={() => {
          if (forgetting !== null) {
            void unlinkServer(forgetting.id).then(async (refusal) => {
              if (refusal === null) {
                notify.worked(say('common.removedName', { name: forgetting.name }));
              } else {
                notify.failed(refusal.message);
              }

              await reread();
            });
          }

          setForgetting(null);
        }}
      />
    </PanelCard>
  );
};

LinkedServerList.displayName = 'LinkedServerList';

export { LinkedServerList };
