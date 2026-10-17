import { rowActionsColumn } from '@ValenceUI/DataTable/rowActionsColumn';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinFilledIcon,
  Calendar as CalendarFilledIcon,
  Plus as PlusFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { refreshLiveSource } from '@ValenceClient/live/refreshLiveSource';
import { removeLiveSource } from '@ValenceClient/live/removeLiveSource';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { LiveGuideDialog } from '@ValenceScreens/components/AdminArea/components/LiveTvPanel/components/LiveGuideDialog/LiveGuideDialog';
import { AddLiveSourceDialog } from '@ValenceScreens/components/AdminArea/components/LiveTvPanel/components/AddLiveSourceDialog/AddLiveSourceDialog';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { PanelCard } from '@ValenceUI/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LiveSource, LiveSourceKind } from '@ValenceContracts/schemas/LiveTv';

const KIND_NAMES: Readonly<Record<LiveSourceKind, string>> = {
  stream: say('screens.adminArea.liveTvPanel.oneStream'),
  playlistUrl: say('screens.adminArea.liveTvPanel.playlistAddress'),
  playlistFile: say('screens.adminArea.liveTvPanel.playlistFile'),
  tuner: say('screens.adminArea.liveTvPanel.tuner'),
  embed: say('screens.adminArea.liveTvPanel.embeddedPage'),
};

/**
 * The live TV sources this server plays from — single streams, embedded pages, playlists and
 * tuners — each with
 * how many channels it gave when it was last read, when that was, and anything wrong with it, and
 * ways to add one, read one again now, or remove one with its channels and guide.
 */
const LiveTvPanel = () => {
  const cache = useQueryClient();
  const sources = useQuery(liveQueries.sources());
  const [isAdding, setIsAdding] = useState(false);
  const [removing, setRemoving] = useState<LiveSource | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [guiding, setGuiding] = useState<LiveSource | null>(null);

  const reread = () => cache.invalidateQueries({ queryKey: liveQueries.key });

  const columns: DataTableColumn<LiveSource>[] = [
    {
      id: 'name',
      header: say('common.name'),
      accessorFn: (source) => source.name,
      meta: { fills: true },
      cell: ({ row }) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-text">{row.original.name}</span>
            <Badge size="sm">{KIND_NAMES[row.original.kind]}</Badge>
          </span>
          {row.original.address === null ? null : (
            <span className="truncate text-xs text-text-muted">{row.original.address}</span>
          )}
          {row.original.problem === null ? null : (
            <span className="text-xs text-danger">{sayAgain(row.original.problem)}</span>
          )}
        </span>
      ),
    },
    {
      id: 'channels',
      header: say('screens.adminArea.liveTvPanel.channels'),
      accessorFn: (source) => source.channelCount,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-text-muted">
          {sayCount('common.count.channels', row.original.channelCount)}
        </span>
      ),
    },
    {
      id: 'read',
      header: say('screens.adminArea.librariesPanel.lastRead'),
      accessorFn: (source) => source.refreshedAt ?? '',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-text-muted">
          {describeSince(row.original.refreshedAt, Date.now())}
        </span>
      ),
    },
    rowActionsColumn(
      (item) => item.name,
      (item) => [
        {
          items: [
            {
              id: 'read',
              label: say('screens.adminArea.linkedServersPanel.readAgainNow'),
              icon: <Icon of={RefreshCwFilledIcon} size={15} />,
              isDisabled: reading !== null,
              onChoose: () => {
                setReading(item.id);
                void refreshLiveSource(item.id)
                  .then(async (sent) => {
                    tellOutcome(
                      say('screens.adminArea.liveTvPanel.readNameCountChannels', {
                        name: item.name,
                        count: String(sent.value?.channelCount ?? 0),
                      }),
                      failureOfRefusal(sent.refusal),
                    );
                    await reread();
                  })
                  .finally(() => {
                    setReading(null);
                  });
              },
            },
          ],
        },
        {
          items: [
            {
              id: 'guide',
              label: say('screens.adminArea.liveTvPanel.guideAddressesMenu'),
              icon: <Icon of={CalendarFilledIcon} size={15} />,
              onChoose: () => {
                setGuiding(item);
              },
            },
          ],
        },
        {
          items: [
            {
              id: 'remove',
              label: say('common.forget'),
              icon: <Icon of={BinFilledIcon} size={15} />,
              isDestructive: true,
              onChoose: () => {
                setRemoving(item);
              },
            },
          ],
        },
      ],
    ),
  ];

  return (
    <PanelCard
      title={say('common.liveTv')}
      isFlush
      actions={
        <PanelCardAction
          icon={PlusFilledIcon}
          onClick={() => {
            setIsAdding(true);
          }}
        >
          {say('screens.adminArea.liveTvPanel.addASource')}
        </PanelCardAction>
      }
    >
      {sources.isError ? (
        <CouldNotRead
          said={say('common.thatCouldNotBeRead')}
          isTryingAgain={sources.isFetching}
          onTryAgain={() => {
            void sources.refetch();
          }}
        />
      ) : sources.isPending ? (
        <Spinner isCentered size="sm" label={say('common.reading')} />
      ) : (
        <DataTable
          label={say('common.liveTv')}
          columns={columns}
          rows={sources.data}
          getRowId={(source) => source.id}
          emptyMessage={say('screens.adminArea.liveTvPanel.noSourcesYet')}
        />
      )}

      <AddLiveSourceDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onAdded={() => {
          void reread();
        }}
      />

      <LiveGuideDialog
        source={guiding}
        onClose={() => {
          setGuiding(null);
        }}
        onChanged={() => {
          void reread();
        }}
      />

      <ConfirmDialog
        title={
          removing === null
            ? say('screens.adminArea.liveTvPanel.removeThisSource')
            : say('common.removeName', { name: removing.name })
        }
        detail={say('screens.adminArea.liveTvPanel.itsChannelsAndGuideGoWithIt')}
        confirmLabel={say('common.forget')}
        isDestructive
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const gone = removing;

          setRemoving(null);

          if (gone !== null) {
            void removeLiveSource(gone.id).then(async (sent) => {
              tellOutcome(
                say('common.removedName', { name: gone.name }),
                failureOfRefusal(sent.refusal),
              );
              await reread();
            });
          }
        }}
      />
    </PanelCard>
  );
};

LiveTvPanel.displayName = 'LiveTvPanel';

export { LiveTvPanel };
