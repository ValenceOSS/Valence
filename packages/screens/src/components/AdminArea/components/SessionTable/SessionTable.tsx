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
import { RowFoldButton } from '@ValenceScreens/components/AdminArea/components/RowFoldButton/RowFoldButton';
import { groupSessionsByViewer } from '@ValenceScreens/components/AdminArea/groupSessionsByViewer';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { SessionRow, SessionTableProps } from './SessionTable.types';

/**
 * Every open session as a row of a table: who has it, with their picture, what they have open, on what, whether it is
 * playing, how far through they are and how it reaches them, with the controls for intervening in
 * a menu at its end. A viewer with more than one session open is one row, with their sessions
 * indented beneath it. The denser way of seeing the same sessions the cards show.
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
  const groups = groupSessionsByViewer([...sessions]);
  const isGrouped = groups.some((group) => group.sessions.length > 1);
  const rows = groups.flatMap((group): SessionRow[] => {
    const parts = group.sessions.map((session): SessionRow => ({
      id: session.clientId,
      session,
      group: null,
      parts: [],
    }));
    const [first] = group.sessions;

    return parts.length > 1 && first !== undefined
      ? [
          {
            id: `viewer:${group.key}`,
            session: first,
            group: { label: group.label, count: parts.length },
            parts,
          },
        ]
      : parts;
  });
  const columns: DataTableColumn<SessionRow>[] = [
    {
      id: 'viewer',
      header: say('screens.adminArea.sessionTable.viewer'),
      accessorFn: (shown) => shown.group?.label ?? nameOfSession(shown.session),
      cell: ({ row }) => {
        if (row.depth > 0) {
          return null;
        }

        const { session, group } = row.original;
        const account = accounts.get(session.accountId ?? '');
        const name = group?.label ?? nameOfSession(session);
        const isOpen = row.getIsExpanded();

        return (
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            {!isGrouped ? null : group === null ? (
              <span className="size-6 shrink-0" />
            ) : (
              <RowFoldButton
                label={say(
                  isOpen
                    ? 'screens.adminArea.sessionTable.hideTheSessionsOfName'
                    : 'screens.adminArea.sessionTable.showTheSessionsOfName',
                  { name },
                )}
                isOpen={isOpen}
                onToggle={() => {
                  row.toggleExpanded();
                }}
              />
            )}
            {account === undefined || session.isGuest ? null : <AccountFace account={account} />}
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-text">{name}</span>
              {group === null ? null : (
                <span className="text-xs text-text-muted">
                  {sayCount('common.count.sessions', group.count)}
                </span>
              )}
            </span>
          </span>
        );
      },
    },
    {
      id: 'watching',
      header: say('common.watching'),
      accessorFn: (shown) => titleOfSession(shown.session),
      cell: ({ row }) => {
        if (row.original.group !== null) {
          return null;
        }

        const episode = episodeOfSession(row.original.session);

        return (
          <span className="flex max-w-[20rem] min-w-0 flex-col">
            <span className="truncate text-text">{titleOfSession(row.original.session)}</span>
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
      accessorFn: (shown) => shown.session.deviceLabel,
      cell: ({ row }) =>
        row.original.group !== null ? null : (
          <DeviceLabel
            deviceLabel={row.original.session.deviceLabel}
            clientKind={row.original.session.clientKind}
          />
        ),
    },
    {
      id: 'state',
      header: say('common.state'),
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.group !== null) {
          return null;
        }

        const { playback, listening, bookListening, reading } = row.original.session;
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
        if (row.original.group !== null) {
          return null;
        }

        const { playback, listening, bookListening } = row.original.session;
        const heard = listening ?? bookListening;
        const health = playback?.health ?? heard;

        return health === null || health.durationSeconds <= 0 ? (
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
        if (row.original.group !== null) {
          return null;
        }

        const { playback, listening } = row.original.session;

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
        if (row.original.group !== null) {
          return null;
        }

        const session = row.original.session;
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
      rows={rows}
      getRowId={(shown) => shown.id}
      getSubRows={(shown) => (shown.parts.length === 0 ? undefined : shown.parts)}
      isOpenAtFirst
      emptyMessage={say('screens.adminArea.activityPanel.nobodyHasTheAppOpenRight')}
    />
  );
};

SessionTable.displayName = 'SessionTable';

export { SessionTable };
