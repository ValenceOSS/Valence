import { say } from '@ValenceI18n/say';
import { Icon } from '@ValenceUI/Icon';
import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Film as FilmFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
  Search as SearchFilledIcon,
  Tape as TapeFilledIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { TextField } from '@ValenceUI/TextField';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaPanelProps } from './MediaPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { formatBytes } from '@ValenceCore/functions/formatBytes';

/**
 * Names a row by its programme rather than by the episode standing in for it, so a series appears
 * under its own name rather than under whichever episode happened to be first.
 *
 * @param item - The item the row is for.
 * @returns What to call it.
 */
const nameOf = (item: MediaSummary): string => item.seriesTitle ?? item.title;

/**
 * Whether an item is an episode of a programme rather than a film, which decides both what its row
 * is called and which corrections make sense for it.
 *
 * @param item - The item.
 * @returns Whether it belongs to a programme.
 */
const isSeries = (item: MediaSummary): boolean =>
  item.seriesTitle !== null && item.seriesTitle !== undefined;

/**
 * Everything the libraries hold, searchable, with the corrections an administrator can make to any
 * of it: saying what a mismatched file really is, choosing the moment its hover preview is cut
 * from, rebuilding the previews and thumbnails made from it, and — for whoever may — deleting it
 * outright, which is asked twice since it cannot be undone. A series stands in the list as one row,
 * so deleting it deletes every episode rather than whichever one happened to stand for it.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param media - Everything the libraries hold.
 * @param onCorrect - Called with the item whose match is to be corrected.
 * @param onChooseMoment - Called with the item whose preview moment is to be chosen.
 * @param onRebuildArtefacts - Called with the item whose previews and thumbnails are to be remade,
 *   answering whether the request was accepted.
 * @param onReencode - Called with the item to be re-encoded, where re-encoding is offered at all.
 * @param onDelete - Called with the item to be deleted — the whole series, for an episode — where
 *   deleting is offered at all, answering whether it went.
 */
const MediaPanel = ({
  isUnreachable = false,
  media,
  onCorrect,
  onChooseMoment,
  onRebuildArtefacts,
  onReencode,
  onDelete,
}: MediaPanelProps) => {
  const [search, setSearch] = useState('');
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
  const [rebuilt, setRebuilt] = useState<ReadonlySet<string>>(new Set());
  const [condemned, setCondemned] = useState<MediaSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rebuild = useCallback(
    async (item: MediaSummary) => {
      setRebuilding(item.id);

      const thrownAway = await onRebuildArtefacts(item);

      setRebuilding(null);

      if (thrownAway) {
        setRebuilt((known) => new Set(known).add(item.id));
      }
    },
    [onRebuildArtefacts],
  );

  const ask = useCallback((item: MediaSummary) => {
    setConfirming(item);
  }, []);

  const shown = useMemo(
    () => media.filter((item) => nameOf(item).toLowerCase().includes(search.trim().toLowerCase())),
    [media, search],
  );

  const columns = useMemo<DataTableColumn<MediaSummary>[]>(
    () => [
      {
        id: 'title',
        header: say('admin.mediaPanel.titleHeader'),
        accessorFn: nameOf,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-text">{nameOf(row.original)}</span>

            {isSeries(row.original) ? (
              <span className="truncate font-body text-xs text-text-muted">
                {row.original.title}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: 'kind',
        header: say('admin.mediaPanel.kindHeader'),
        accessorFn: (item) => (isSeries(item) ? 'series' : 'film'),
        filterFn: (row, columnId, filterValue) =>
          filterValue === undefined || row.getValue(columnId) === filterValue,
        meta: {
          filterOptions: [
            { id: 'film', label: say('admin.mediaPanel.filterFilms') },
            { id: 'series', label: say('admin.mediaPanel.filterSeries') },
          ],
        },
        cell: ({ row }) => (
          <Badge size="sm">
            {say(isSeries(row.original) ? 'admin.mediaPanel.series' : 'admin.mediaPanel.film')}
          </Badge>
        ),
      },
      {
        id: 'year',
        header: say('admin.mediaPanel.yearHeader'),
        accessorFn: (item) => item.year ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">{row.original.year ?? '—'}</span>
        ),
      },
      {
        id: 'size',
        header: say('admin.mediaPanel.sizeHeader'),
        accessorFn: (item) => item.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.sizeBytes === null || row.original.sizeBytes === undefined
              ? '—'
              : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'artwork',
        header: say('admin.mediaPanel.artworkHeader'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.hasPoster ? (
            <span className="font-body text-xs text-text-muted">
              {say('admin.mediaPanel.poster')}
            </span>
          ) : (
            <span className="font-body text-xs text-danger">{say('admin.mediaPanel.missing')}</span>
          ),
      },
      {
        id: 'correct',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={say('admin.mediaPanel.actionsFor', { title: nameOf(row.original) })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'rebuild',
                      label:
                        rebuilding === row.original.id
                          ? say('admin.mediaPanel.rebuilding')
                          : rebuilt.has(row.original.id)
                            ? say('admin.mediaPanel.willRebuild')
                            : say('admin.mediaPanel.rebuildPreviews'),
                      icon: <Icon of={RefreshCwFilledIcon} size={15} />,
                      isDisabled: rebuilding === row.original.id,
                      onChoose: () => {
                        ask(row.original);
                      },
                    },
                    {
                      id: 'wrong-match',
                      label: say('admin.mediaPanel.wrongMatch'),
                      icon: <Icon of={SearchFilledIcon} size={15} />,
                      onChoose: () => {
                        onCorrect(row.original);
                      },
                    },
                    {
                      id: 'preview-moment',
                      label: say('admin.mediaPanel.previewMoment'),
                      icon: <Icon of={FilmFilledIcon} size={15} />,
                      onChoose: () => {
                        onChooseMoment(row.original);
                      },
                    },
                    ...(onReencode === undefined
                      ? []
                      : [
                          {
                            id: 'reencode',
                            label: say('admin.mediaPanel.reencode'),
                            icon: <Icon of={TapeFilledIcon} size={15} />,
                            onChoose: () => {
                              onReencode(row.original);
                            },
                          },
                        ]),
                  ],
                },
                ...(onDelete === undefined
                  ? []
                  : [
                      {
                        items: [
                          {
                            id: 'delete',
                            label: isSeries(row.original)
                              ? say('admin.mediaPanel.deleteSeriesMenu')
                              : say('admin.mediaPanel.deleteFileMenu'),
                            icon: <Icon of={BinFilledIcon} size={15} />,
                            isDestructive: true,
                            onChoose: () => {
                              setCondemned(row.original);
                            },
                          },
                        ],
                      },
                    ]),
              ]}
            />
          </span>
        ),
      },
    ],
    [ask, rebuilt, onCorrect, onReencode, onChooseMoment, onDelete, rebuilding],
  );

  return (
    <PanelCard
      title={say('admin.mediaPanel.heading')}
      isFlush
      actions={
        <TextField
          label={say('admin.mediaPanel.searchLabel')}
          isLabelHidden
          size="sm"
          type="search"
          placeholder={say('admin.mediaPanel.searchPlaceholder')}
          value={search}
          onValueChange={setSearch}
          className="w-64 max-w-full"
        />
      }
    >
      {isUnreachable ? (
        <p className="p-5 text-sm text-text-muted">{say('admin.mediaPanel.unreachable')}</p>
      ) : (
        <DataTable
          label={say('admin.mediaPanel.tableLabel')}
          columns={columns}
          rows={shown}
          pageSize={10}
          emptyMessage={
            media.length === 0
              ? say('admin.mediaPanel.emptyNothingScanned')
              : say('admin.mediaPanel.emptyNoMatch')
          }
        />
      )}
      <ConfirmDialog
        isOpen={confirming !== null}
        title={say('admin.mediaPanel.rebuildTitle', {
          title: confirming === null ? say('admin.mediaPanel.thisTitle') : nameOf(confirming),
        })}
        detail={say('admin.mediaPanel.rebuildDetail')}
        confirmLabel={say('admin.mediaPanel.rebuildPreviews')}
        isDestructive
        isBusy={rebuilding !== null}
        onClose={() => {
          setConfirming(null);
        }}
        onConfirm={() => {
          if (confirming === null) {
            return;
          }

          void rebuild(confirming).then(() => {
            setConfirming(null);
          });
        }}
      />
      {onDelete === undefined ? null : (
        <ConfirmDialog
          isOpen={condemned !== null}
          title={
            condemned !== null && isSeries(condemned)
              ? say('admin.mediaPanel.deleteSeriesTitle', { title: nameOf(condemned) })
              : say('admin.mediaPanel.deleteFileTitle', {
                  title: condemned === null ? say('admin.mediaPanel.thisFile') : nameOf(condemned),
                })
          }
          detail={
            condemned !== null && isSeries(condemned)
              ? say('admin.mediaPanel.deleteSeriesDetail')
              : say('admin.mediaPanel.deleteFileDetail')
          }
          confirmLabel={
            condemned !== null && isSeries(condemned)
              ? say('admin.mediaPanel.deleteSeries')
              : say('admin.mediaPanel.deleteFile')
          }
          isDestructive
          isBusy={isDeleting}
          onClose={() => {
            setCondemned(null);
          }}
          onConfirm={() => {
            if (condemned === null) {
              return;
            }

            setIsDeleting(true);

            void onDelete(condemned).then((isGone) => {
              setIsDeleting(false);

              if (isGone) {
                setCondemned(null);
              }
            });
          }}
        />
      )}
    </PanelCard>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
