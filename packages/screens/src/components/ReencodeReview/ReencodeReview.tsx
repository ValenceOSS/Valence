import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Slider } from '@ValenceUI/Slider';
import { useHeldWhileClosing } from '@ValenceUI/Dialog.useHeldWhileClosing';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { frameAt } from './frameAt';
import type { ReencodeReviewProps } from './ReencodeReview.types';
import { say } from '@ValenceI18n/say';

const A_SCENE_WITH_MOTION = 0.4;

/**
 * Judging a finished encode before the original it replaced is disposed of.
 *
 * The whole reason this screen exists: automated checks establish that a file is **valid** — the
 * right runtime, the tracks that were asked for, a bitstream that decodes — and none of them can
 * establish that it is **good**. Whether the compression shows, whether the grain turned to mush,
 * whether the picture went grey because the colour metadata was dropped: every one of those passes
 * a probe and needs eyes.
 *
 * So both files are still on disk and both are shown at the same moment, side by side. A frame is
 * the right unit for this rather than a clip, because artefacts are easier to see held still than
 * in motion and it works for any codec on any browser. Watching it move is a button away, in the
 * real player, for the part of the judgement a still cannot make.
 *
 * Neither answer is the default and neither is hurried. Waiting forever is allowed and costs only
 * disk.
 *
 * @param reencode - The encode being judged, or nothing while none is.
 * @param onConfirm - Called to accept it and dispose of the original.
 * @param onReject - Called to refuse it and put the original back.
 * @param onWatch - Called to open the real player on the new encode.
 * @param onClose - Called to put the dialog away without deciding.
 */
const ReencodeReview = ({
  reencode: requested,
  onConfirm,
  onReject,
  onWatch,
  onClose,
}: ReencodeReviewProps) => {
  const reencode = useHeldWhileClosing(requested, requested !== null);
  const [atSeconds, setAtSeconds] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);

  useEffect(() => {
    if (reencode === null) {
      return;
    }

    setAtSeconds(Math.floor(reencode.durationSeconds * A_SCENE_WITH_MOTION));
  }, [reencode]);

  if (reencode === null) {
    return null;
  }

  const freed =
    reencode.producedBytes === null
      ? null
      : Math.max(0, reencode.originalSizeBytes - reencode.producedBytes);

  const decide = async (accepted: boolean) => {
    setIsDeciding(true);

    const done = accepted ? await onConfirm(reencode.id) : await onReject(reencode.id);

    setIsDeciding(false);
    setIsConfirming(false);

    if (done) {
      onClose();
    }
  };

  return (
    <Dialog
      label={say('screens.reencodeReview.label')}
      isOpen={requested !== null}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        title={
          reencode.seriesTitle === null
            ? reencode.title
            : `${reencode.seriesTitle} — ${reencode.title}`
        }
        detail={say('screens.reencodeReview.detail')}
      />

      <DialogContent>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="flex flex-col gap-2">
              <img
                src={frameAt(reencode.id, 'original', atSeconds)}
                alt={say('screens.reencodeReview.originalAlt', { at: formatDuration(atSeconds) })}
                className="w-full rounded-lg border border-line bg-shade/40"
              />
              <figcaption className="font-body text-xs text-text-muted">
                {say('screens.reencodeReview.originalCaption', {
                  size: formatBytes(reencode.originalSizeBytes),
                })}
              </figcaption>
            </figure>

            <figure className="flex flex-col gap-2">
              <img
                src={frameAt(reencode.id, 'encode', atSeconds)}
                alt={say('screens.reencodeReview.encodeAlt', { at: formatDuration(atSeconds) })}
                className="w-full rounded-lg border border-line bg-shade/40"
              />
              <figcaption className="font-body text-xs text-text-muted">
                {say('screens.reencodeReview.encodeCaption', {
                  size:
                    reencode.producedBytes === null
                      ? say('screens.reencodeReview.sizeUnknown')
                      : formatBytes(reencode.producedBytes),
                })}
                {reencode.quality === null ? '' : ` · ${reencode.quality}`}
                {reencode.videoCodec === null ? '' : ` ${reencode.videoCodec}`}
              </figcaption>
            </figure>
          </div>

          <Slider
            label={say('screens.reencodeReview.whereToLook')}
            max={Math.max(1, Math.floor(reencode.durationSeconds))}
            value={atSeconds}
            valueLabel={(seconds) => formatDuration(seconds)}
            onValueChange={setAtSeconds}
          />

          <p className="font-body text-xs text-text-muted">
            {say('screens.reencodeReview.lookHint', { at: formatDuration(atSeconds) })}
          </p>

          <Callout title={say('screens.reencodeReview.stillLimitsTitle')}>
            {say('screens.reencodeReview.stillLimitsBody')}
          </Callout>
        </div>
      </DialogContent>

      <DialogFooter
        confirm={{
          label:
            freed === null
              ? say('screens.reencodeReview.confirm')
              : say('screens.reencodeReview.confirmAndFree', { size: formatBytes(freed) }),
          isDisabled: isDeciding,
          onChoose: () => {
            setIsConfirming(true);
          },
        }}
      >
        {onWatch === undefined ? null : (
          <Button
            variant="ghost"
            onClick={() => {
              onWatch(reencode);
            }}
          >
            {say('screens.reencodeReview.watch')}
          </Button>
        )}

        <Button
          variant="secondary"
          isLoading={isDeciding}
          onClick={() => {
            void decide(false);
          }}
        >
          {say('screens.reencodeReview.reject')}
        </Button>
      </DialogFooter>

      <ConfirmDialog
        isOpen={isConfirming}
        isDestructive
        isBusy={isDeciding}
        title={say('screens.reencodeReview.disposeTitle')}
        detail={say('screens.reencodeReview.disposeDetail')}
        confirmLabel={
          freed === null
            ? say('screens.reencodeReview.dispose')
            : say('screens.reencodeReview.disposeAndFree', { size: formatBytes(freed) })
        }
        onClose={() => {
          setIsConfirming(false);
        }}
        onConfirm={() => {
          void decide(true);
        }}
      />
    </Dialog>
  );
};

ReencodeReview.displayName = 'ReencodeReview';

export { ReencodeReview };
