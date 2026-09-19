import { useEffect, useMemo, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { REENCODE_CODECS } from '@ValenceContracts/schemas/Reencode';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { describeCodecTrade } from '@ValenceCore/functions/describeCodecTrade';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { describeSaving } from '@ValenceScreens/components/AdminArea/components/EncodingPanel/describeSaving';
import { isLargerThan } from '@ValenceScreens/components/AdminArea/components/EncodingPanel/isLargerThan';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type {
  ReencodeCodec,
  ReencodeMode,
  ReencodeSettings,
} from '@ValenceContracts/schemas/Reencode';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { ReencodeDialogProps } from './ReencodeDialog.types';

const MODES: readonly { id: ReencodeMode; label: string }[] = [
  { id: 'replace', label: 'Replace' },
  { id: 'keep', label: 'Keep alongside' },
  { id: 'audioOnly', label: 'Audio only' },
];

const MODE_MEANINGS: Record<ReencodeMode, string> = {
  replace:
    'Frees disk. The original is kept until you have watched the result and confirmed it — nothing else in Valence destroys your own media.',
  keep: 'Costs disk, and buys a household where the box never converts anything at seven on a Sunday.',
  audioOnly:
    'The picture is copied untouched and only the lossless audio is compressed. The safest of the three.',
};

const SECTION = 'text-xs uppercase tracking-[0.14em] text-text-muted';

/**
 * What a file is called on a row, which is the programme rather than the episode.
 *
 * @param item - The item.
 * @returns What to call it.
 */
const nameOf = (item: MediaSummary): string =>
  item.seriesTitle === null || item.seriesTitle === undefined
    ? item.title
    : `${item.seriesTitle} — ${item.title}`;

/**
 * Choosing what to re-encode, to what, and seeing what it would cost before anything starts.
 *
 * Read top to bottom as a sentence: what to work on, what to do with it, what that costs. The files
 * come first because picking them is the work and everything else is three small decisions; the
 * cost comes last because it is what somebody checks with their hand already on the button.
 *
 * The projection is shown both ways round on purpose. Replacing frees disk and keeping a rendition
 * alongside spends it, and since "re-encode" reads as "saves space" to almost everybody, a screen
 * that only ever counted down would mislead half the people using it.
 *
 * Every refusal is stated against the file it is about rather than as a count, because an operator
 * queueing twenty files on a Friday needs to know on Friday which three will not work.
 *
 * @param isOpen - Whether it is showing.
 * @param media - Everything the libraries hold, to choose from.
 * @param estimate - What the server says the current choice would cost.
 * @param isWeighing - Whether the server is still working that out.
 * @param onWeigh - Called with the choice whenever it changes.
 * @param onStart - Called to queue the choice, answering whether it was taken on.
 * @param onClose - Called to put it away.
 */
const ReencodeDialog = ({
  isOpen,
  media,
  estimate,
  isWeighing = false,
  onWeigh,
  onStart,
  onClose,
}: ReencodeDialogProps) => {
  const [mode, setMode] = useState<ReencodeMode>('replace');
  const [quality, setQuality] = useState<QualityStepId>('1080p');
  const [videoCodec, setVideoCodec] = useState<ReencodeCodec>('hevc');
  const [compressesAudio, setCompressesAudio] = useState(false);
  const [largerThan, setLargerThan] = useState('');
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const settings = useMemo<ReencodeSettings>(
    () => ({
      mode,
      quality: mode === 'audioOnly' ? null : quality,
      videoCodec: mode === 'audioOnly' ? null : videoCodec,
      audio: mode === 'audioOnly' || compressesAudio ? 'compress' : 'keep',
    }),
    [mode, quality, videoCodec, compressesAudio],
  );

  const threshold = largerThan.trim() === '' ? null : Number(largerThan);

  const shown = useMemo(
    () =>
      media.filter(
        (item) =>
          isLargerThan(item.sizeBytes, threshold) &&
          nameOf(item).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [media, threshold, search],
  );

  const ids = useMemo(() => [...chosen], [chosen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    onWeigh(ids, settings);
  }, [isOpen, ids, settings, onWeigh]);

  useEffect(() => {
    if (!isOpen) {
      setChosen(new Set());
      setSearch('');
    }
  }, [isOpen]);

  const refusedCount = (estimate?.candidates ?? []).filter((one) => one.refusal !== null).length;
  const acceptedCount = ids.length - refusedCount;
  const allShownChosen = shown.length > 0 && shown.every((item) => chosen.has(item.id));
  const someShownChosen = shown.some((item) => chosen.has(item.id));

  const wanted =
    estimate === null
      ? null
      : Math.max(0, estimate.afterBytes - estimate.nowBytes) + estimate.committedBytes;

  const room = judgeFreeSpace({ bytes: wanted, freeBytes: estimate?.freeBytes ?? null });
  const isFull = (estimate?.awaitingReview ?? 0) >= (estimate?.awaitingReviewCap ?? 5);

  const toggle = (id: string, isChosen: boolean) => {
    const next = new Set(chosen);

    if (isChosen) {
      next.add(id);
    } else {
      next.delete(id);
    }

    setChosen(next);
  };

  const toggleAll = (isChosen: boolean) => {
    const next = new Set(chosen);

    for (const item of shown) {
      if (isChosen) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
    }

    setChosen(next);
  };

  const start = async () => {
    setIsStarting(true);

    const started = await onStart(ids, settings);

    setIsStarting(false);
    setIsConfirming(false);

    if (started) {
      onClose();
    }
  };

  return (
    <Dialog label="Re-encode media" isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title="Re-encode media"
        detail="Nothing starts until you press the button at the bottom."
      />

      <DialogContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className={SECTION}>What to work on</legend>

          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label="Find a title"
              isLabelHidden
              size="sm"
              type="search"
              placeholder="Find a title"
              value={search}
              onValueChange={setSearch}
              className="min-w-0 flex-1"
            />

            <TextField
              label="Larger than (GB)"
              size="sm"
              type="number"
              min={0}
              placeholder="Any size"
              value={largerThan}
              onValueChange={setLargerThan}
              className="w-36"
            />
          </div>

          {media.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing has been scanned yet.</p>
          ) : (
            <>
              <Checkbox
                label={`Everything shown (${shown.length.toString()})`}
                checked={allShownChosen}
                isMixed={someShownChosen && !allShownChosen}
                onCheckedChange={toggleAll}
              />

              <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-line bg-subtle p-2">
                {shown.map((item) => {
                  const refusal =
                    estimate?.candidates.find((one) => one.mediaId === item.id)?.refusal ?? null;

                  return (
                    <li key={item.id} className="rounded-md px-2 py-1.5 hover:bg-shade/20">
                      <Checkbox
                        label={nameOf(item)}
                        description={`${item.width.toString()}×${item.height.toString()} · ${item.videoCodec} · ${formatBytes(item.sizeBytes ?? 0)}${refusal === null ? '' : ` — ${refusal.detail}`}`}
                        checked={chosen.has(item.id)}
                        onCheckedChange={(next) => {
                          toggle(item.id, next);
                        }}
                      />
                    </li>
                  );
                })}

                {shown.length === 0 ? (
                  <li className="px-2 py-3 text-sm text-text-muted">Nothing matches that.</li>
                ) : null}
              </ul>
            </>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={SECTION}>What to do with them</legend>

          <SegmentedRow
            label="What to do with the encode"
            size="sm"
            items={MODES}
            value={mode}
            onSelect={(id) => {
              setMode(MODES.find((one) => one.id === id)?.id ?? 'replace');
            }}
          />

          <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
            {MODE_MEANINGS[mode]}
          </p>

          {mode === 'audioOnly' ? null : (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-subtle px-3 py-2">
              <Choice
                label="Quality"
                value={quality}
                options={QUALITY_STEPS.map((step) => ({ id: step.id, label: step.label }))}
                onSelect={(id) => {
                  setQuality(QUALITY_STEPS.find((step) => step.id === id)?.id ?? '1080p');
                }}
              />

              <Choice
                label="Codec"
                value={videoCodec}
                options={REENCODE_CODECS.map((codec) => ({
                  id: codec,
                  label: CODEC_NAMES[codec] ?? codec,
                  detail: describeCodecTrade(codec),
                }))}
                onSelect={(id) => {
                  setVideoCodec(REENCODE_CODECS.find((one) => one === id) ?? 'hevc');
                }}
              />
            </div>
          )}

          {mode === 'audioOnly' ? null : (
            <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
              {describeCodecTrade(videoCodec)}
            </p>
          )}

          {mode === 'audioOnly' ? null : (
            <Checkbox
              label="Compress the lossless audio too"
              description="A TrueHD or DTS-HD track is often a large share of a remux. Compressing it narrows 7.1 to 5.1."
              checked={compressesAudio}
              onCheckedChange={setCompressesAudio}
            />
          )}
        </fieldset>

        {estimate === null || ids.length === 0 ? null : (
          <fieldset className="flex flex-col gap-3">
            <legend className={SECTION}>What that costs</legend>

            <div className="flex flex-col gap-1 rounded-lg border border-line bg-subtle p-3">
              <span className="text-sm text-text">
                {formatBytes(estimate.nowBytes)} → {formatBytes(estimate.afterBytes)}
              </span>
              <span className="font-body text-xs text-text-muted">
                {describeSaving({
                  mode,
                  nowBytes: estimate.nowBytes,
                  afterBytes: estimate.afterBytes,
                })}
              </span>
              <span className="font-body text-xs text-text-muted">
                {estimate.freeBytes === null
                  ? 'Free space could not be read.'
                  : `${formatBytes(estimate.freeBytes)} free`}
                {estimate.committedBytes === 0
                  ? ''
                  : `, and ${formatBytes(estimate.committedBytes)} already promised to work in the queue`}
              </span>
            </div>

            {room === 'willNotFit' ? (
              <Callout title="There is not enough room" tone="danger">
                Filling a media server disk takes down streaming, transcoding and the database with
                it, which is a far worse outcome than a large file.
              </Callout>
            ) : room === 'tight' ? (
              <Callout title="This would use most of what is left" tone="warning">
                Every encode waiting to be judged holds both a film and its replacement until you
                look at it.
              </Callout>
            ) : null}

            {isFull ? (
              <Callout title="The queue is paused" tone="warning">
                {`${estimate.awaitingReview.toString()} encodes are already waiting to be judged. Review some before adding more.`}
              </Callout>
            ) : null}

            {refusedCount === 0 ? null : (
              <Callout title={`${refusedCount.toString()} of these will be turned away`}>
                The reason is written under each one.
              </Callout>
            )}
          </fieldset>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="primary"
          isLoading={isWeighing || isStarting}
          disabled={acceptedCount <= 0 || room === 'willNotFit'}
          onClick={() => {
            if (mode === 'keep') {
              void start();

              return;
            }

            setIsConfirming(true);
          }}
        >
          {acceptedCount <= 0
            ? 'Choose something first'
            : mode === 'keep'
              ? `Keep ${acceptedCount.toString()} alongside`
              : `Re-encode ${acceptedCount.toString()}`}
        </Button>
      </DialogFooter>

      <ConfirmDialog
        isOpen={isConfirming}
        isDestructive
        isBusy={isStarting}
        title={`Re-encode ${acceptedCount.toString()} ${acceptedCount === 1 ? 'file' : 'files'}?`}
        detail="Each original is kept until you have watched the encode and confirmed it, and rejecting puts it back in one action. Once you confirm one, what the encoder discarded is gone for good."
        confirmLabel="Queue them"
        onClose={() => {
          setIsConfirming(false);
        }}
        onConfirm={() => {
          void start();
        }}
      />
    </Dialog>
  );
};

ReencodeDialog.displayName = 'ReencodeDialog';

export { MODES, MODE_MEANINGS, ReencodeDialog };
