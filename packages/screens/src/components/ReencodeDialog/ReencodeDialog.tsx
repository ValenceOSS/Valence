import { sayAgain } from '@ValenceI18n/sayAgain';
import { useEffect, useMemo, useState } from 'react';
import { Callout } from '@ValenceUI/Callout';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { REENCODE_CODECS, REENCODE_CONTAINERS } from '@ValenceContracts/schemas/Reencode';
import { readBitrate } from '@ValenceScreens/admin/readBitrate';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { describeCodecTrade } from '@ValenceCore/functions/describeCodecTrade';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { FileGroup } from './components/FileGroup/FileGroup';
import { groupIntoThings } from './groupIntoThings';
import { useWeighing } from './useWeighing';
import { describeSaving } from '@ValenceScreens/components/AdminArea/components/EncodingPanel/describeSaving';
import { isLargerThan } from '@ValenceScreens/components/AdminArea/components/EncodingPanel/isLargerThan';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type {
  ReencodeCodec,
  ReencodeContainer,
  ReencodeMode,
  ReencodePlacement,
  ReencodeSettings,
} from '@ValenceContracts/schemas/Reencode';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { ReencodeDialogProps } from './ReencodeDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MODES: readonly { id: ReencodeMode; label: string }[] = [
  { id: 'replace', label: say('common.replace') },
  { id: 'keep', label: say('screens.reencodeDialog.keepAlongside') },
  { id: 'audioOnly', label: say('common.audioOnly') },
];

const MODE_MEANINGS: Record<ReencodeMode, string> = {
  replace: say('screens.reencodeDialog.freesDiskTheOriginalIsKept'),
  keep: say('screens.reencodeDialog.costsDiskAndBuysAHousehold'),
  audioOnly: say('screens.reencodeDialog.thePictureIsCopiedUntouchedAnd'),
};

const SECTION = 'text-xs font-medium text-text-muted';

const AS_IT_WAS = 'original';

const CONTAINER_CHOICES = [
  { id: AS_IT_WAS, label: say('screens.reencodeDialog.asTheOriginalIs') },
  ...REENCODE_CONTAINERS.map((container) => ({ id: container, label: container.toUpperCase() })),
];

const PLACEMENT_CHOICES: readonly { id: ReencodePlacement; label: string }[] = [
  { id: 'hidden', label: say('screens.reencodeDialog.inValencesOwnFolder') },
  { id: 'beside', label: say('screens.reencodeDialog.besideTheOriginal') },
];

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
 * @param libraries - The libraries to choose between, shown one at a time.
 * @param media - Every file the libraries hold, one entry each rather than one per programme.
 * @param estimate - What the server says the current choice would cost.
 * @param isWeighing - Whether the server is still working that out.
 * @param onWeigh - Called with the choice whenever it changes.
 * @param onStart - Called to queue the choice, answering whether it was taken on.
 * @param onClose - Called to put it away.
 */
const ReencodeDialog = ({
  isOpen,
  libraries,
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
  const [container, setContainer] = useState<ReencodeContainer | null>(null);
  const [placement, setPlacement] = useState<ReencodePlacement>('hidden');
  const [ceiling, setCeiling] = useState('');
  const [largerThan, setLargerThan] = useState('');
  const [search, setSearch] = useState('');
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const ceilingRead = readBitrate(ceiling);
  const ceilingKbps = ceilingRead.kind === 'kbps' ? ceilingRead.kbps : null;

  const settings = useMemo<ReencodeSettings>(
    () => ({
      mode,
      quality: mode === 'audioOnly' ? null : quality,
      videoCodec: mode === 'audioOnly' ? null : videoCodec,
      audio: mode === 'audioOnly' || compressesAudio ? 'compress' : 'keep',
      ...(mode !== 'keep'
        ? {}
        : {
            placement,
            ...(container === null ? {} : { container }),
            ...(ceilingKbps === null ? {} : { maxBitrateKbps: ceilingKbps }),
          }),
    }),
    [mode, quality, videoCodec, compressesAudio, placement, container, ceilingKbps],
  );

  const threshold = largerThan.trim() === '' ? null : Number(largerThan);

  const looking = libraryId ?? libraries[0]?.id ?? null;

  const shown = useMemo(
    () =>
      media.filter(
        (item) =>
          item.libraryId === looking &&
          isLargerThan(item.sizeBytes, threshold) &&
          nameOf(item).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [media, looking, threshold, search],
  );

  const groups = useMemo(() => groupIntoThings(shown), [shown]);

  const chosenElsewhere = useMemo(
    () => media.filter((item) => chosen.has(item.id) && item.libraryId !== looking).length,
    [media, chosen, looking],
  );

  const ids = useMemo(() => [...chosen], [chosen]);

  useWeighing(isOpen, ids, settings, onWeigh);

  useEffect(() => {
    if (!isOpen) {
      setChosen(new Set());
      setSearch('');
      setLibraryId(null);
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

  const toggleMany = (items: readonly MediaSummary[], isChosen: boolean) => {
    const next = new Set(chosen);

    for (const item of items) {
      if (isChosen) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
    }

    setChosen(next);
  };

  const refusalFor = (mediaId: string): string | null => {
    const refusal = estimate?.candidates.find((one) => one.mediaId === mediaId)?.refusal;

    return refusal === undefined || refusal === null ? null : sayAgain(refusal.detail);
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
    <Dialog label={say('common.reEncodeMedia')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={say('common.reEncodeMedia')}
        detail={say('screens.reencodeDialog.nothingStartsUntilYouPressThe')}
      />

      <DialogContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className={SECTION}>{say('screens.reencodeDialog.whatToWorkOn')}</legend>

          {libraries.length < 2 ? null : (
            <SegmentedRow
              label={say('common.library')}
              size="sm"
              items={libraries.map((one) => ({ id: one.id, label: one.name }))}
              value={looking ?? ''}
              onSelect={setLibraryId}
            />
          )}

          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label={say('common.findATitle')}
              size="sm"
              type="search"
              placeholder={say('screens.reencodeDialog.anyTitle')}
              value={search}
              onValueChange={setSearch}
              className="min-w-0 flex-1"
            />

            <TextField
              label={say('screens.reencodeDialog.largerThanGB')}
              size="sm"
              type="number"
              min={0}
              placeholder={say('common.anySize')}
              value={largerThan}
              onValueChange={setLargerThan}
              className="w-36"
            />
          </div>

          {media.length === 0 ? (
            <p className="text-sm text-text-muted">
              {say('screens.reencodeDialog.nothingHasBeenScannedYet')}
            </p>
          ) : (
            <>
              <Checkbox
                label={
                  chosenElsewhere === 0
                    ? sayCount('screens.reencodeDialog.everythingShown', shown.length)
                    : sayCount(
                        'screens.reencodeDialog.everythingShownChosenElsewhere',
                        shown.length,
                        {
                          chosenElsewhere: chosenElsewhere.toString(),
                        },
                      )
                }
                checked={allShownChosen}
                isMixed={someShownChosen && !allShownChosen}
                onCheckedChange={(next) => {
                  toggleMany(shown, next);
                }}
              />

              <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-lg border border-line bg-subtle p-2">
                {groups.map((group) => (
                  <FileGroup
                    key={group.key}
                    group={group}
                    chosen={chosen}
                    refusalFor={refusalFor}
                    onToggle={toggleMany}
                  />
                ))}

                {groups.length === 0 ? (
                  <li className="px-2 py-3 text-sm text-text-muted">
                    {say('common.nothingMatchesThat')}
                  </li>
                ) : null}
              </ul>
            </>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={SECTION}>{say('screens.reencodeDialog.whatToDoWithThem')}</legend>

          <SegmentedRow
            label={say('screens.reencodeDialog.whatToDoWithTheEncode')}
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
                label={say('common.quality')}
                value={quality}
                options={QUALITY_STEPS.map((step) => ({ id: step.id, label: step.label }))}
                onSelect={(id) => {
                  setQuality(QUALITY_STEPS.find((step) => step.id === id)?.id ?? '1080p');
                }}
              />

              <Choice
                label={say('screens.reencodeDialog.codec')}
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

          {mode === 'keep' ? (
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-subtle px-3 py-2">
              <Choice
                label={say('screens.adminArea.preTranscodingCard.container')}
                value={container ?? AS_IT_WAS}
                options={CONTAINER_CHOICES}
                onSelect={(id) => {
                  setContainer(REENCODE_CONTAINERS.find((one) => one === id) ?? null);
                }}
              />

              <Choice
                label={say('screens.reencodeDialog.whereItIsKept')}
                value={placement}
                options={PLACEMENT_CHOICES}
                onSelect={(id) => {
                  setPlacement(id === 'beside' ? 'beside' : 'hidden');
                }}
              />

              <TextField
                label={say('screens.adminArea.preTranscodingCard.bitrateCeiling')}
                description={say(
                  'screens.adminArea.preTranscodingCard.inKilobitsASecondLeaveEmpty',
                )}
                size="sm"
                type="number"
                min={100}
                placeholder={say('common.noCeiling')}
                value={ceiling}
                onValueChange={setCeiling}
                {...(ceilingRead.kind === 'invalid'
                  ? { error: say('screens.adminArea.preTranscodingCard.aWholeNumberFrom100') }
                  : {})}
              />
            </div>
          ) : null}

          {mode === 'audioOnly' ? null : (
            <Checkbox
              label={say('screens.reencodeDialog.compressTheLosslessAudioToo')}
              description={say('screens.reencodeDialog.aTrueHDOrDTSHDTrack')}
              checked={compressesAudio}
              onCheckedChange={setCompressesAudio}
            />
          )}
        </fieldset>

        {estimate === null || ids.length === 0 ? null : (
          <fieldset className="flex flex-col gap-3">
            <legend className={SECTION}>{say('screens.reencodeDialog.whatThatCosts')}</legend>

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
                  ? estimate.committedBytes === 0
                    ? say('screens.reencodeDialog.freeSpaceCouldNotBeRead')
                    : say('screens.reencodeDialog.freeSpaceCouldNotBeReadAndCommitted', {
                        committed: formatBytes(estimate.committedBytes),
                      })
                  : estimate.committedBytes === 0
                    ? say('screens.reencodeDialog.freeBytesFree', {
                        free: formatBytes(estimate.freeBytes),
                      })
                    : say('screens.reencodeDialog.freeBytesFreeAndCommitted', {
                        free: formatBytes(estimate.freeBytes),
                        committed: formatBytes(estimate.committedBytes),
                      })}
              </span>
            </div>

            {room === 'willNotFit' ? (
              <Callout title={say('screens.reencodeDialog.thereIsNotEnoughRoom')} tone="danger">
                {say('screens.reencodeDialog.fillingAMediaServerDiskTakes')}
              </Callout>
            ) : room === 'tight' ? (
              <Callout title={say('screens.reencodeDialog.thisWouldUseMostOfWhat')} tone="warning">
                {say('screens.reencodeDialog.everyEncodeWaitingToBeJudged')}
              </Callout>
            ) : null}

            {isFull ? (
              <Callout title={say('screens.reencodeDialog.theQueueIsPaused')} tone="warning">
                {say('screens.reencodeDialog.awaitingReviewEncodesAreAlreadyWaitingTo', {
                  awaitingReview: estimate.awaitingReview.toString(),
                })}
              </Callout>
            ) : null}

            {refusedCount === 0 ? null : (
              <Callout
                title={say('screens.reencodeDialog.refusedCountOfTheseWillBeTurned', {
                  refusedCount: refusedCount.toString(),
                })}
              >
                {say('screens.reencodeDialog.theReasonIsWrittenUnderEach')}
              </Callout>
            )}
          </fieldset>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label:
            acceptedCount <= 0
              ? say('screens.reencodeDialog.chooseSomethingFirst')
              : mode === 'keep'
                ? say('screens.reencodeDialog.keepAcceptedCountAlongside', {
                    acceptedCount: acceptedCount.toString(),
                  })
                : `Re-encode ${acceptedCount.toString()}`,
          isLoading: isWeighing || isStarting,
          isDisabled: acceptedCount <= 0 || room === 'willNotFit' || ceilingRead.kind === 'invalid',
          onChoose: () => {
            if (mode === 'keep') {
              void start();

              return;
            }

            setIsConfirming(true);
          },
        }}
      />

      <ConfirmDialog
        isOpen={isConfirming}
        isDestructive
        isBusy={isStarting}
        title={sayCount('screens.reencodeDialog.reEncodeCountFiles', acceptedCount)}
        detail={say('screens.reencodeDialog.eachOriginalIsKeptUntilYou')}
        confirmLabel={say('common.addToQueue')}
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

export { ReencodeDialog };
