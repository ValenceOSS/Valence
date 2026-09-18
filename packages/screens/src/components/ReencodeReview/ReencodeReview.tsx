import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Slider } from '@ValenceUI/Slider';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { frameAt } from './frameAt';
import type { ReencodeReviewProps } from './ReencodeReview.types';

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
  reencode,
  onConfirm,
  onReject,
  onWatch,
  onClose,
}: ReencodeReviewProps) => {
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
    <Dialog label="Review a re-encode" isOpen onClose={onClose} size="stage">
      <DialogTitle
        title={reencode.seriesTitle === null ? reencode.title : `${reencode.seriesTitle} — ${reencode.title}`}
        detail="Both files are still here. Nothing is discarded until you say so."
      />

      <DialogContent>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="flex flex-col gap-2">
              <img
                src={frameAt(reencode.id, 'original', atSeconds)}
                alt={`The original at ${formatDuration(atSeconds)}`}
                className="w-full rounded-lg border border-line bg-shade/40"
              />
              <figcaption className="font-body text-xs text-text-muted">
                The original · {formatBytes(reencode.originalSizeBytes)}
              </figcaption>
            </figure>

            <figure className="flex flex-col gap-2">
              <img
                src={frameAt(reencode.id, 'encode', atSeconds)}
                alt={`The new encode at ${formatDuration(atSeconds)}`}
                className="w-full rounded-lg border border-line bg-shade/40"
              />
              <figcaption className="font-body text-xs text-text-muted">
                The new encode ·{' '}
                {reencode.producedBytes === null
                  ? 'size unknown'
                  : formatBytes(reencode.producedBytes)}
                {reencode.quality === null ? '' : ` · ${reencode.quality}`}
                {reencode.videoCodec === null ? '' : ` ${reencode.videoCodec}`}
              </figcaption>
            </figure>
          </div>

          <Slider
            label="Where in the film to look"
            max={Math.max(1, Math.floor(reencode.durationSeconds))}
            value={atSeconds}
            valueLabel={(seconds) => formatDuration(seconds)}
            onValueChange={setAtSeconds}
          />

          <p className="font-body text-xs text-text-muted">
            {formatDuration(atSeconds)} — pick a scene with motion rather than the opening titles.
            Grain, banding and a grey picture all show up there and nowhere else.
          </p>

          <Callout title="What a still cannot tell you">
            Compression that only shows while things move, and audio, need the real player. Both
            files are on disk, so nothing about this is final until you choose.
          </Callout>
        </div>
      </DialogContent>

      <DialogFooter>
        {onWatch === undefined ? null : (
          <Button
            variant="ghost"
            onClick={() => {
              onWatch(reencode);
            }}
          >
            Watch it
          </Button>
        )}

        <Button
          variant="secondary"
          isLoading={isDeciding}
          onClick={() => {
            void decide(false);
          }}
        >
          Reject and put the original back
        </Button>

        <Button
          variant="primary"
          disabled={isDeciding}
          onClick={() => {
            setIsConfirming(true);
          }}
        >
          {freed === null ? 'Confirm' : `Confirm and free ${formatBytes(freed)}`}
        </Button>
      </DialogFooter>

      <ConfirmDialog
        isOpen={isConfirming}
        isDestructive
        isBusy={isDeciding}
        title="Dispose of the original?"
        detail="The original file is deleted. What the encoder discarded cannot be recovered, and if this was the only copy, nothing brings it back."
        confirmLabel={freed === null ? 'Dispose of it' : `Dispose of it and free ${formatBytes(freed)}`}
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

export { A_SCENE_WITH_MOTION, ReencodeReview };
