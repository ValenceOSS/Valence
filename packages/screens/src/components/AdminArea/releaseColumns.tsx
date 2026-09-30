import { sayAgain } from '@ValenceI18n/sayAgain';
import { Badge } from '@ValenceUI/Badge';
import { describeAge } from '@ValenceCore/functions/describeAge';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type ReleaseColumnsOptions = {
  judged: ReadonlyMap<string, Judgement>;
  pickedId: string | null;
  now: number;
};

/**
 * The columns every table of releases shares: what the release is and where it was found, how it
 * was judged where it was — picked, refused and why, or what it scored — and its size, who is
 * sharing it, and how old it is.
 *
 * @param judged - How each release was judged, by its id; empty where none were.
 * @param pickedId - The release that would be chosen, where one would.
 * @param now - The moment ages are told from.
 * @returns The columns.
 */
const releaseColumns = ({
  judged,
  pickedId,
  now,
}: ReleaseColumnsOptions): DataTableColumn<Release>[] => [
  {
    id: 'title',
    header: say('common.release'),
    accessorFn: (release) => release.title,
    cell: ({ row }) => (
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="break-all text-sm text-text">{row.original.title}</span>

        <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          {row.original.indexerName}
          <Badge size="sm">
            {row.original.protocol === 'torrent'
              ? say('screens.adminArea.releaseColumns.torrent')
              : say('screens.adminArea.releaseColumns.usenet')}
          </Badge>
        </span>
      </span>
    ),
  },
  ...(judged.size === 0
    ? []
    : [
        {
          id: 'verdict',
          header: say('screens.adminArea.releaseColumns.verdict'),
          enableSorting: false,
          cell: ({ row }: { row: { original: Release } }) => {
            const judgement = judged.get(row.original.id);

            if (judgement === undefined) {
              return null;
            }

            const isPicked = pickedId === row.original.id;

            return (
              <span className="flex min-w-0 flex-col items-start gap-1">
                <Badge
                  size="sm"
                  tone={isPicked ? 'success' : judgement.isRejected ? 'danger' : 'quiet'}
                >
                  {isPicked
                    ? say('screens.adminArea.releaseColumns.pickedScore', {
                        score: judgement.score.toString(),
                      })
                    : judgement.isRejected
                      ? say('common.refused')
                      : say('screens.adminArea.releaseColumns.scoresScore', {
                          score: judgement.score.toString(),
                        })}
                </Badge>

                <span className="text-xs text-text-muted">
                  {(judgement.isRejected ? judgement.rejections : judgement.reasons)
                    .map(sayAgain)
                    .join('. ')}
                </span>
              </span>
            );
          },
        },
      ]),
  {
    id: 'size',
    header: say('common.size'),
    accessorFn: (release) => release.sizeBytes ?? -1,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-text">
        {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
      </span>
    ),
  },
  {
    id: 'peers',
    header: say('common.peers'),
    accessorFn: (release) => release.seeders ?? release.grabs ?? -1,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-text">
        {row.original.protocol === 'usenet'
          ? row.original.grabs === null
            ? '—'
            : sayCount('common.count.grabs', row.original.grabs)
          : `${row.original.seeders?.toString() ?? '?'} / ${row.original.leechers?.toString() ?? '?'}`}
      </span>
    ),
  },
  {
    id: 'age',
    header: say('screens.adminArea.releaseColumns.age'),
    accessorFn: (release) => (release.publishedAt === null ? 0 : Date.parse(release.publishedAt)),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-text-muted">
        {row.original.publishedAt === null
          ? '—'
          : (describeAge(row.original.publishedAt, now) ?? '—')}
      </span>
    ),
  },
];

export { releaseColumns };
