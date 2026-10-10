import {
  MessageSquare as MessageSquareIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
  Stop as StopIcon,
} from '@keyline-icons/react/fill';
import { useQuery } from '@tanstack/react-query';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { DeviceLabel } from '@ValenceScreens/components/AdminArea/components/DeviceLabel/DeviceLabel';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { episodeOfSession } from '@ValenceScreens/admin/episodeOfSession';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { titleOfSession } from '@ValenceScreens/admin/titleOfSession';
import { say } from '@ValenceI18n/say';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SessionTableProps } from './SessionTable.types';

/**
 * Every open session as a row of a table: who has it, with their picture, what they have open, on what, whether it is
 * playing, how far through they are and how it reaches them, with the controls for intervening in
 * a menu at its end. The denser way of seeing the same sessions the cards show.
 *
 * @param sessions - Every session open at the moment.
 * @param busyClientId - The session an instruction is in flight for, if any.
 * @param onStop - Called with the session to stop.
 * @param onPause - Called with the session to pause.
 * @param onResume - Called with the session to let carry on.
 * @param onMessage - Called with the session to tell something.
 */
const SessionTable = ({
  sessions,
  busyClientId,
  onStop,
  onPause,
  onResume,
  onMessage,
}: SessionTableProps) => {
  const known = useQuery(adminQueries.accounts());
  const accounts = new Map((known.data ?? []).map((account) => [account.id, account]));
  const columns: DataTableColumn<ActiveSession>[] = [
    {
      id: 'viewer',
      header: say('screens.adminArea.sessionTable.viewer'),
      accessorFn: (session) => nameOfSession(session),
      cell: ({ row }) => {
        const account = accounts.get(row.original.accountId ?? '');

        return (
          <span className="flex items-center gap-2.5 whitespace-nowrap font-medium text-text">
            {account === undefined || row.original.isGuest ? null : (
              <AccountFace account={account} />
            )}
            {nameOfSession(row.original)}
          </span>
        );
      },
    },
    {
      id: 'watching',
      header: say('common.watching'),
      accessorFn: (session) => titleOfSession(session),
      cell: ({ row }) => {
        const episode = episodeOfSession(row.original);

        return (
          <span className="flex max-w-[20rem] min-w-0 flex-col">
            <span className="truncate text-text">{titleOfSession(row.original)}</span>
            {episode === null ? null : (
              <span className="truncate text-xs text-text-muted">{episode}</span>
            )}
          </span>
        );
      },
    },
    {
      id: 'device',
      header: say('common.device'),
      accessorFn: (session) => session.deviceLabel,
      cell: ({ row }) => (
        <DeviceLabel deviceLabel={row.original.deviceLabel} clientKind={row.original.clientKind} />
      ),
    },
    {
      id: 'state',
      header: say('common.state'),
      enableSorting: false,
      cell: ({ row }) => {
        const { playback, listening, bookListening, reading } = row.original;
        const heard = listening ?? bookListening;
        const isActive = playback !== null || heard !== null;
        const isPlaying = playback?.isPlaying ?? heard?.isPlaying ?? false;

        return (
          <span className="whitespace-nowrap text-text-muted">
            {isActive
              ? isPlaying
                ? say('common.playing')
                : say('common.paused')
              : reading !== null
                ? say('common.reading')
                : '—'}
          </span>
        );
      },
    },
    {
      id: 'progress',
      header: say('common.progress'),
      enableSorting: false,
      cell: ({ row }) => {
        const { playback, listening, bookListening } = row.original;
        const heard = listening ?? bookListening;
        const health = playback?.health ?? heard;

        return health === null || health === undefined || health.durationSeconds <= 0 ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {formatDuration(health.positionSeconds)} / {formatDuration(health.durationSeconds)}
          </span>
        );
      },
    },
    {
      id: 'delivery',
      header: say('tv.player.streamStats.delivery'),
      enableSorting: false,
      cell: ({ row }) => {
        const { playback, listening } = row.original;

        return playback !== null ? (
          <Badge size="sm">{describeSessionDelivery(playback).label}</Badge>
        ) : listening !== null ? (
          <Badge size="sm">
            {listening.delivery === 'encoded' ? say('common.encoding') : say('common.direct')}
          </Badge>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const session = row.original;
        const isBusy = busyClientId === session.clientId;
        const isPlaying = session.playback?.isPlaying ?? false;

        return (
          <span className="flex justify-end">
            <ActionMenu
              label={say('common.actionsForName', { name: nameOfSession(session) })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    ...(session.playback === null
                      ? []
                      : [
                          isPlaying
                            ? {
                                id: 'pause',
                                label: say('common.pause'),
                                icon: <Icon of={PauseFilledIcon} size={15} />,
                                isDisabled: isBusy,
                                onChoose: () => {
                                  onPause(session.clientId);
                                },
                              }
                            : {
                                id: 'play',
                                label: say('common.play'),
                                icon: <Icon of={PlayFilledIcon} size={15} />,
                                isDisabled: isBusy,
                                onChoose: () => {
                                  onResume(session.clientId);
                                },
                              },
                        ]),
                    {
                      id: 'message',
                      label: say('screens.adminArea.sessionCard.message'),
                      icon: <Icon of={MessageSquareIcon} size={15} />,
                      isDisabled: isBusy,
                      onChoose: () => {
                        onMessage(session);
                      },
                    },
                    {
                      id: 'stop',
                      label: say('common.stop'),
                      icon: <Icon of={StopIcon} size={15} />,
                      isDestructive: true,
                      isDisabled: isBusy,
                      onChoose: () => {
                        onStop(session.clientId);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      label={say('common.sessions')}
      columns={columns}
      rows={[...sessions]}
      getRowId={(session) => session.clientId}
      emptyMessage={say('screens.adminArea.activityPanel.nobodyHasTheAppOpenRight')}
    />
  );
};

SessionTable.displayName = 'SessionTable';

export { SessionTable };
