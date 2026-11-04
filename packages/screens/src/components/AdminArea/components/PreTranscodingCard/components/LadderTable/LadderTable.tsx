import { useEffect, useMemo, useRef } from 'react';
import { Bin as BinIcon, GripVertical as GripVerticalIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
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

const LIMITS_KBPS = [
  300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000,
];

/**
 * Writes a bitrate in megabits a second, as the bitrate menu shows it.
 *
 * @param kbps - The bitrate in kilobits a second.
 * @returns The bitrate in words, like "4.5 Mb/s".
 */
const mbps = (kbps: number): string =>
  say('screens.adminArea.ladderTable.megabitsASecond', {
    megabits: (kbps / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 }),
  });

/**
 * Names the limit a rung's bitrate field stands at, as the menu of limits knows it.
 *
 * @param bitrate - The ceiling as stored.
 * @returns The limit's id, or the usual limit where there is none.
 */
const chosenLimitOf = (bitrate: string): string => {
  const reading = readBitrate(bitrate);

  return reading.kind === 'kbps' ? String(reading.kbps) : 'auto';
};

/**
 * The limits a rung's bitrate can be held to: the usual limit for its quality first, then every
 * preset under it, with the rung's own ceiling kept where it is none of them.
 *
 * @param current - The rung's ceiling as stored.
 * @param quality - The rung's quality.
 * @returns The choices, highest first after the usual one.
 */
const limitChoices = (current: string, quality: string) => {
  const automatic =
    QUALITY_STEPS.find((step) => step.id === quality)?.maxVideoBitrateKbps ?? Infinity;
  const presets = LIMITS_KBPS.filter((kbps) => kbps < automatic).map((kbps) => ({
    id: String(kbps),
    label: mbps(kbps),
  }));
  const reading = readBitrate(current);
  const extra =
    reading.kind === 'kbps' && !presets.some((one) => one.id === String(reading.kbps))
      ? [{ id: String(reading.kbps), label: mbps(reading.kbps) }]
      : [];

  return [
    {
      id: 'auto',
      label: Number.isFinite(automatic)
        ? say('screens.adminArea.ladderTable.automaticAt', { bitrate: mbps(automatic) })
        : say('common.automatic'),
    },
    ...[...extra, ...presets].sort((a, b) => Number(b.id) - Number(a.id)),
  ];
};

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
        meta: { hasLineBefore: true },
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
        meta: { hasLineBefore: true },
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
        meta: { hasLineBefore: true },
        header: say('screens.adminArea.preTranscodingCard.bitrateCeiling'),
        enableSorting: false,
        cell: ({ row }) => (
          <SelectField
            label={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
            isLabelHidden
            size="sm"
            options={limitChoices(row.original.bitrate, row.original.target.quality)}
            value={chosenLimitOf(row.original.bitrate)}
            onSelect={(id) => {
              told.current.onBitrateChange(row.original.id, id === 'auto' ? '' : id);
            }}
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
