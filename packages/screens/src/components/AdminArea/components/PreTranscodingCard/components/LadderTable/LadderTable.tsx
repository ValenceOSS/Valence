import { useEffect, useMemo, useRef } from 'react';
import { Bin as BinIcon, GripVertical as GripVerticalIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { PRE_TRANSCODE_QUALITIES } from '@ValenceContracts/schemas/PreTranscoding';
import { REENCODE_CODECS, REENCODE_CONTAINERS } from '@ValenceContracts/schemas/Reencode';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { DraftRung, LadderTableProps } from './LadderTable.types';

const QUALITY_CHOICES = PRE_TRANSCODE_QUALITIES.map((id) => ({
  id,
  label: QUALITY_STEPS.find((step) => step.id === id)?.label ?? id,
}));

const CODEC_CHOICES = REENCODE_CODECS.map((codec) => ({
  id: codec,
  label: CODEC_NAMES[codec] ?? codec,
}));

const CONTAINER_CHOICES = REENCODE_CONTAINERS.map((container) => ({
  id: container,
  label: container.toUpperCase(),
}));

/**
 * The pre-transcoding ladder as a table, one rung to a row: the picture, codec and container a copy
 * is made at, the most bits a second it may spend, and how far the library has got at that rung.
 * Rungs are dragged into the order they are worked in, and the last one cannot be removed. The
 * columns stay the same between renders, so a field keeps its cursor while a ceiling is typed. The
 * rung that takes the original's place, where the original is not kept, says so.
 *
 * @param rungs - The ladder as it is being edited.
 * @param onChange - Called with a rung and what changed about it.
 * @param onBitrateChange - Called with a rung and its ceiling as typed.
 * @param onRemove - Called with the rung to take off the ladder.
 * @param onReorder - Called with the rungs in their new order.
 */
const LadderTable = ({
  rungs,
  onChange,
  onBitrateChange,
  onRemove,
  onReorder,
}: LadderTableProps) => {
  const told = useRef({ onChange, onBitrateChange, onRemove });

  useEffect(() => {
    told.current = { onChange, onBitrateChange, onRemove };
  });

  const columns = useMemo<DataTableColumn<DraftRung>[]>(
    () => [
      {
        id: 'drag',
        header: '',
        enableSorting: false,
        meta: { shrinks: true },
        cell: () => (
          <Icon
            of={GripVerticalIcon}
            size={16}
            tone="muted"
            label={say('common.dragToChangeTheOrder')}
          />
        ),
      },
      {
        id: 'quality',
        header: say('common.quality'),
        enableSorting: false,
        cell: ({ row }) => (
          <SelectField
            label={say('common.quality')}
            isLabelHidden
            size="sm"
            options={QUALITY_CHOICES}
            value={row.original.target.quality}
            onSelect={(id) => {
              told.current.onChange(row.original.id, {
                quality: PRE_TRANSCODE_QUALITIES.find((one) => one === id) ?? '1080p',
              });
            }}
          />
        ),
      },
      {
        id: 'codec',
        header: say('screens.reencodeDialog.codec'),
        enableSorting: false,
        cell: ({ row }) => (
          <SelectField
            label={say('screens.reencodeDialog.codec')}
            isLabelHidden
            size="sm"
            options={CODEC_CHOICES}
            value={row.original.target.videoCodec}
            onSelect={(id) => {
              told.current.onChange(row.original.id, {
                videoCodec: REENCODE_CODECS.find((one) => one === id) ?? 'h264',
              });
            }}
          />
        ),
      },
      {
        id: 'container',
        header: say('screens.adminArea.preTranscodingCard.container'),
        enableSorting: false,
        cell: ({ row }) => (
          <SelectField
            label={say('screens.adminArea.preTranscodingCard.container')}
            isLabelHidden
            size="sm"
            options={CONTAINER_CHOICES}
            value={row.original.target.container}
            onSelect={(id) => {
              told.current.onChange(row.original.id, {
                container: REENCODE_CONTAINERS.find((one) => one === id) ?? 'mp4',
              });
            }}
          />
        ),
      },
      {
        id: 'ceiling',
        header: say('screens.adminArea.preTranscodingCard.bitrateCeiling'),
        enableSorting: false,
        cell: ({ row }) => (
          <TextField
            label={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
            isLabelHidden
            type="number"
            size="sm"
            min={100}
            placeholder={say('common.noBitrateCeiling')}
            value={row.original.bitrate}
            onValueChange={(next) => {
              told.current.onBitrateChange(row.original.id, next);
            }}
            {...(readBitrate(row.original.bitrate).kind === 'invalid'
              ? { error: say('screens.adminArea.preTranscodingCard.aWholeNumberFrom100') }
              : {})}
          />
        ),
      },
      {
        id: 'progress',
        header: say('screens.adminArea.preTranscodingCard.copiesMade'),
        enableSorting: false,
        meta: { shrinks: true },
        cell: ({ row }) => {
          const { progress, replacesOriginal } = row.original;

          return progress === null ? (
            replacesOriginal ? (
              <Badge size="sm" tone="warning">
                {say('screens.adminArea.preTranscodingCard.replacesTheOriginal')}
              </Badge>
            ) : (
              <span className="text-text-muted">—</span>
            )
          ) : (
            <span className="flex flex-col items-start gap-1 whitespace-nowrap tabular-nums">
              {replacesOriginal ? (
                <Badge size="sm" tone="warning">
                  {say('screens.adminArea.preTranscodingCard.replacesTheOriginal')}
                </Badge>
              ) : null}
              <span className="text-text">
                {say('screens.adminArea.preTranscodingCard.madeOfAll', {
                  made: progress.copiesMade.toString(),
                  all: (progress.copiesMade + progress.stillNeeded).toString(),
                })}
              </span>
              <span className="font-body text-xs text-text-muted">
                {formatBytes(progress.bytesKept)}
              </span>
            </span>
          );
        },
      },
      {
        id: 'remove',
        header: '',
        enableSorting: false,
        meta: { shrinks: true },
        cell: ({ row }) => (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={say('screens.adminArea.preTranscodingCard.removeTheQualityRung', {
              quality:
                QUALITY_CHOICES.find((one) => one.id === row.original.target.quality)?.label ??
                row.original.target.quality,
            })}
            disabled={rungs.length <= 1}
            onClick={() => {
              told.current.onRemove(row.original.id);
            }}
          >
            <Icon of={BinIcon} size={15} />
          </Button>
        ),
      },
    ],
    [rungs.length],
  );

  return (
    <DataTable
      label={say('screens.adminArea.preTranscodingCard.theLadder')}
      height="compact"
      columns={columns}
      rows={[...rungs]}
      getRowId={(rung) => rung.id}
      onReorder={onReorder}
    />
  );
};

LadderTable.displayName = 'LadderTable';

export { LadderTable };
