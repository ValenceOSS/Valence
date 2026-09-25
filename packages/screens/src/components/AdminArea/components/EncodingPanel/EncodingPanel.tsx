import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { DataTable } from '@ValenceUI/DataTable';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { RefreshCw as RefreshCwIcon, Tape as TapeIcon } from '@keyline-icons/react';
import { describeEncodeProgress } from '@ValenceClient/admin/describeEncodeProgress';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { sortReencodes } from './sortReencodes';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { EncodingPanelProps } from './EncodingPanel.types';
import type { Reencode } from '@ValenceContracts/schemas/Reencode';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * What an encode is called on a screen listing several, which is the programme rather than the
 * episode standing in for it.
 *
 * @param reencode - The re-encode.
 * @returns What to call it.
 */
const nameOf = (reencode: Reencode): string =>
  reencode.seriesTitle === null ? reencode.title : `${reencode.seriesTitle} — ${reencode.title}`;

/**
 * What confirming one would free, where it is a replacement that has produced something.
 *
 * @param reencode - The re-encode.
 * @returns The saving in words, or nothing where there is not one to state yet.
 */
const freedBy = (reencode: Reencode): string | null => {
  if (reencode.mode === 'keep' || reencode.producedBytes === null) {
    return null;
  }

  const freed = reencode.originalSizeBytes - reencode.producedBytes;

  return freed <= 0 ? null : formatBytes(freed);
};

/**
 * Every re-encode an administrator has asked for: what is waiting for them, what is running, and
 * what has already happened.
 *
 * Waiting for judgement comes first, above everything, and that ordering is the feature rather than
 * a layout choice. Each one of those is holding both a film and its replacement until somebody
 * looks at it, nothing hurries them, and a queue of forgotten ones is exactly how a feature for
 * reclaiming storage ends up exhausting it.
 *
 * @param isUnreachable - Whether the server would not say.
 * @param reencodes - Every re-encode.
 * @param awaitingReviewCap - How many may wait for judgement before the queue pauses.
 * @param onReview - Called with the one to be judged.
 * @param onStop - Called with the one to be stopped, answering whether it was.
 * @param onChoose - Called to open the chooser.
 */
const EncodingPanel = ({
  isUnreachable = false,
  reencodes,
  awaitingReviewCap = 5,
  onReview,
  onStop,
  onChoose,
}: EncodingPanelProps) => {
  const [stopping, setStopping] = useState<string | null>(null);

  const { awaitingReview, underWay, settled } = useMemo(
    () => sortReencodes(reencodes),
    [reencodes],
  );

  const stop = useCallback(
    async (reencode: Reencode) => {
      setStopping(reencode.id);
      await onStop(reencode);
      setStopping(null);
    },
    [onStop],
  );

  const columns = useMemo<DataTableColumn<Reencode>[]>(
    () => [
      {
        id: 'title',
        header: say('admin.encodingPanel.titleColumn'),
        accessorFn: nameOf,
        cell: ({ row }) => <span className="truncate text-text">{nameOf(row.original)}</span>,
      },
      {
        id: 'what',
        header: say('admin.encodingPanel.askedColumn'),
        enableSorting: false,
        accessorFn: (one) => one.mode,
        cell: ({ row }) => (
          <span className="font-body text-xs text-text-muted">
            {row.original.mode === 'keep'
              ? say('admin.encodingPanel.keptAlongside')
              : row.original.mode === 'audioOnly'
                ? say('admin.encodingPanel.audioOnly')
                : say('admin.encodingPanel.replaced')}
            {row.original.quality === null ? '' : ` · ${row.original.quality}`}
          </span>
        ),
      },
      {
        id: 'state',
        header: say('admin.encodingPanel.stateColumn'),
        accessorFn: (one) => one.state,
        cell: ({ row }) => (
          <Badge
            size="sm"
            tone={
              row.original.state === 'failed'
                ? 'danger'
                : row.original.state === 'finished'
                  ? 'success'
                  : 'quiet'
            }
          >
            {describeReencodeState(row.original.state)}
          </Badge>
        ),
      },
      {
        id: 'failure',
        header: say('admin.encodingPanel.whyColumn'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-body text-xs text-text-muted">{row.original.failure ?? '—'}</span>
        ),
      },
    ],
    [],
  );

  if (isUnreachable) {
    return (
      <PanelCard title={say('admin.encodingPanel.heading')}>
        <p className="text-sm text-text-muted">{say('admin.encodingPanel.unreachable')}</p>
      </PanelCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PanelCard
        title={say('admin.encodingPanel.waitingHeading')}
        actions={
          <PanelCardAction icon={RefreshCwIcon} onClick={onChoose}>
            {say('admin.encodingPanel.reencodeSomething')}
          </PanelCardAction>
        }
      >
        {awaitingReview.length === 0 ? (
          <NothingHere
            of={TapeIcon}
            title={say('admin.encodingPanel.nothingWaiting')}
            detail={say('admin.encodingPanel.nothingWaitingDetail')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <Callout
              title={sayCount('admin.encodingPanel.holding', awaitingReview.length)}
              tone={awaitingReview.length >= awaitingReviewCap ? 'warning' : 'quiet'}
            >
              {awaitingReview.length >= awaitingReviewCap
                ? say('admin.encodingPanel.paused', { cap: awaitingReviewCap })
                : say('admin.encodingPanel.nothingThrownAway')}
            </Callout>

            <ul className="flex flex-col gap-2">
              {awaitingReview.map((one) => (
                <li
                  key={one.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line bg-subtle p-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-text">{nameOf(one)}</span>
                    <span className="font-body text-xs text-text-muted">
                      {say(
                        freedBy(one) === null
                          ? 'admin.encodingPanel.sizes'
                          : 'admin.encodingPanel.sizesFreeing',
                        {
                          before: formatBytes(one.originalSizeBytes),
                          after:
                            one.producedBytes === null
                              ? say('admin.encodingPanel.unknownSize')
                              : formatBytes(one.producedBytes),
                          freed: freedBy(one) ?? '',
                        },
                      )}
                    </span>
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onReview(one);
                    }}
                  >
                    {say('admin.encodingPanel.review')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PanelCard>

      <PanelCard title={say('admin.encodingPanel.underWayHeading')}>
        {underWay.length === 0 ? (
          <p className="text-sm text-text-muted">{say('admin.encodingPanel.nothingUnderWay')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {underWay.map((one) => (
              <li key={one.id} className="flex items-center gap-4">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm text-text">{nameOf(one)}</span>

                  <ProgressBar
                    label={`${nameOf(one)}: ${describeReencodeState(one.state)}`}
                    value={one.state === 'queued' ? 0 : one.progress}
                    max={1}
                    readout={
                      <span className="font-body text-xs text-text-muted">
                        {describeReencodeState(one.state)}
                        {describeEncodeProgress(one) === ''
                          ? ''
                          : ` · ${describeEncodeProgress(one)}`}
                      </span>
                    }
                  />
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={stopping === one.id}
                  onClick={() => {
                    void stop(one);
                  }}
                >
                  {say('admin.encodingPanel.stop')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title={say('admin.encodingPanel.doneHeading')} isFlush>
        <DataTable
          label={say('admin.encodingPanel.doneLabel')}
          columns={columns}
          rows={settled}
          pageSize={10}
          getRowId={(row) => row.id}
          emptyMessage={say('admin.encodingPanel.nothingDone')}
        />
      </PanelCard>
    </div>
  );
};

EncodingPanel.displayName = 'EncodingPanel';

export { EncodingPanel };
