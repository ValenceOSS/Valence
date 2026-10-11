import { Star as StarIcon } from '@keyline-icons/react';
import { Star as StarFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { ChannelLogo } from '@ValenceScreens/components/LiveTvPage/components/ChannelLogo/ChannelLogo';
import { ChannelTags } from '@ValenceScreens/components/LiveTvPage/components/ChannelTags/ChannelTags';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import type { LiveChannelTableProps } from './LiveChannelTable.types';

const ROWS_A_PAGE = 60;

/**
 * A clock time as the viewer reads it, such as `19:30`.
 *
 * @param at - The moment, as an ISO string.
 * @returns The time.
 */
const timeOf = (at: string): string =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * Every channel as a row of a table, for a list too long or too unguided for a timeline: the
 * channel with its logo and number, what is on it now where the guide knows, its genres, and how
 * it was when last checked, with a star to keep it. Choosing a row plays the channel; more rows
 * arrive as the table is scrolled.
 *
 * @param channels - The channels, in order.
 * @param programmes - What is on them.
 * @param now - The time now, in milliseconds.
 * @param chosenId - The channel playing, if any.
 * @param onChoose - Told which channel to play.
 * @param onToggleFavourite - Told which channel to keep, or stop keeping.
 * @param hasProxy - Whether streams this server is refused are tried through a proxy too.
 */
const LiveChannelTable = ({
  channels,
  programmes,
  now,
  chosenId,
  onChoose,
  onToggleFavourite,
  hasProxy = false,
}: LiveChannelTableProps) => {
  const onNow = new Map<string, LiveProgramme>();

  for (const programme of programmes) {
    if (Date.parse(programme.startsAt) <= now && now < Date.parse(programme.endsAt)) {
      onNow.set(programme.channelId, programme);
    }
  }

  const columns: DataTableColumn<LiveChannel>[] = [
    {
      id: 'channel',
      header: say('screens.liveTvPage.channel'),
      accessorFn: (channel) => channelTagsOf(channel.name).name,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-3">
          <ChannelLogo
            channelId={row.original.id}
            name={row.original.name}
            hasLogo={row.original.hasLogo}
            health={row.original.health}
            className="size-10"
          />
          <span className="flex min-w-0 items-baseline gap-1.5">
            {row.original.number === null ? null : (
              <span className="shrink-0 text-xs tabular-nums text-text-muted">
                {row.original.number}
              </span>
            )}
            <span
              className={cn(
                'truncate font-medium',
                row.original.id === chosenId ? 'text-accent' : 'text-text',
              )}
            >
              {channelTagsOf(row.original.name).name}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: 'onNow',
      header: say('screens.liveTvPage.onNow'),
      meta: { fills: true },
      accessorFn: (channel) => onNow.get(channel.id)?.title ?? '',
      cell: ({ row }) => {
        const programme = onNow.get(row.original.id);

        return programme === undefined ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-text">{programme.title}</span>
            <span className="truncate text-xs tabular-nums text-text-muted">
              {timeOf(programme.startsAt)} – {timeOf(programme.endsAt)}
            </span>
          </span>
        );
      },
    },
    {
      id: 'genre',
      header: say('common.genre'),
      accessorFn: (channel) => groupsOf(channel.group).join(', '),
      cell: ({ row }) =>
        groupsOf(row.original.group).length === 0 ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {groupsOf(row.original.group).map((group) => (
              <Badge key={group} size="sm" tone="quiet">
                {group}
              </Badge>
            ))}
          </span>
        ),
    },
    {
      id: 'status',
      header: say('common.state'),
      accessorFn: (channel) => channel.health ?? '',
      cell: ({ row }) =>
        row.original.health === 'onAir' ? (
          <span className="flex flex-wrap items-center gap-1">
            <Badge size="sm" tone="success">
              {say('screens.liveTvPage.onAir')}
            </Badge>
            <ChannelTags channel={row.original} hasProxy={hasProxy} />
          </span>
        ) : (
          <ChannelTags channel={row.original} hasProxy={hasProxy} />
        ),
    },
    {
      id: 'keep',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => (
        <Button
          variant="bare"
          size="none"
          isIconOnly
          label={
            row.original.isFavourite
              ? say('screens.liveTvPage.stopKeepingName', { name: row.original.name })
              : say('screens.liveTvPage.keepName', { name: row.original.name })
          }
          aria-pressed={row.original.isFavourite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavourite(row.original);
          }}
          className={cn('size-8', row.original.isFavourite ? 'text-warning' : 'text-text-muted')}
        >
          <Icon of={row.original.isFavourite ? StarFilledIcon : StarIcon} size={15} />
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      label={say('common.liveTv')}
      columns={columns}
      rows={[...channels]}
      getRowId={(channel) => channel.id}
      onChooseRow={(channel) => {
        onChoose(channel.id);
      }}
      growsOnScroll
      pageSize={ROWS_A_PAGE}
      height="compact"
    />
  );
};

LiveChannelTable.displayName = 'LiveChannelTable';

export { LiveChannelTable };
