import { notify } from '@ValenceUI/notify';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { RangeSlider } from '@ValenceUI/RangeSlider';
import { clipEnd } from './clipEnd';
import { limitClip } from './limitClip';
import { clearPreviewMoment, setPreviewMoment } from '@ValenceClient/library/fetchLibrary';
import { fetchTrickplay } from '@ValenceScreens/playback/fetchTrickplay';
import { TrickplayFrame } from '@ValenceScreens/components/VideoPlayer/components/TrickplayFrame/TrickplayFrame';
import type { Trickplay } from '@ValenceScreens/playback/fetchTrickplay';
import type { PreviewMomentPickerProps } from './PreviewMomentPicker.types';

const AUTOMATIC_POSITION = 0.2;

const DEFAULT_CLIP_SECONDS = 24;

const LONGEST_CLIP_SECONDS = 300;

const OPENING_CLIP_SECONDS = 300;

/**
 * Where the clip is cut from when nobody has chosen: a fifth of the way in, the same fraction the
 * media service uses.
 *
 * @param durationSeconds - How long the item runs.
 * @returns The second the automatic clip starts at.
 */
const automaticMoment = (durationSeconds: number): number =>
  Math.floor(durationSeconds * AUTOMATIC_POSITION);

/**
 * Chooses where an item's hover preview clip comes from, instead of the fixed fraction the media
 * service guesses at. The guess lands on title cards, black frames and spoilers often enough that
 * somebody who knows the film wants to point at the shot that sells it — so this is a range across
 * the film: one handle where the clip starts and one where it ends, with the frame at each above.
 *
 * The frames are drawn on their own, with no time over them, since what is being chosen is the shot.
 * Going back to automatic is offered only where a moment was chosen, so the dialog never offers to
 * undo what nobody did.
 *
 * @param mediaId - The item whose preview is being chosen.
 * @param title - What it is called, for the heading.
 * @param durationSeconds - How long it runs, which is how far the scrub reaches.
 * @param current - The moment already chosen, or null where the preview is automatic.
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Told when the dialog is dismissed.
 * @param onChanged - Told the moment the server kept, or null once it is back to automatic.
 */
const PreviewMomentPicker = ({
  mediaId,
  title,
  durationSeconds,
  current,
  isOpen,
  onClose,
  onChanged,
}: PreviewMomentPickerProps) => {
  const currentAt = current?.atSeconds ?? null;
  const currentLength = current?.durationSeconds ?? null;
  const [atSeconds, setAtSeconds] = useState(currentAt ?? automaticMoment(durationSeconds));
  const [lengthSeconds, setLengthSeconds] = useState(currentLength ?? OPENING_CLIP_SECONDS);
  const [trickplay, setTrickplay] = useState<Trickplay | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAtSeconds(currentAt ?? automaticMoment(durationSeconds));
    setLengthSeconds(currentLength ?? OPENING_CLIP_SECONDS);
    setProblem(null);
  }, [isOpen, currentAt, currentLength, durationSeconds]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isStillOpen = true;

    void fetchTrickplay(mediaId).then((found) => {
      if (isStillOpen) {
        setTrickplay(found);
      }
    });

    return () => {
      isStillOpen = false;
    };
  }, [isOpen, mediaId]);

  const lastSecond = Math.max(Math.floor(durationSeconds) - 1, 0);
  const endsAt = clipEnd(atSeconds, lengthSeconds, lastSecond);
  const keptLength = endsAt - atSeconds;

  const keep = async () => {
    setIsSaving(true);
    setProblem(null);

    const answer = await setPreviewMoment(mediaId, {
      atSeconds,
      durationSeconds: keptLength === DEFAULT_CLIP_SECONDS ? null : keptLength,
    });

    setIsSaving(false);

    if ('problem' in answer) {
      setProblem(answer.problem);

      return;
    }

    notify.worked('Saved the preview moment.');
    onChanged(answer);
    onClose();
  };

  const backToAutomatic = async () => {
    setIsSaving(true);
    setProblem(null);

    const cleared = await clearPreviewMoment(mediaId);

    setIsSaving(false);

    if (cleared === null) {
      setProblem('The server would not put the preview back to automatic.');

      return;
    }

    notify.worked('Put the preview back to automatic.');
    onChanged(null);
    onClose();
  };

  return (
    <Dialog label="Choose the preview moment" isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={`Preview moment for ${title}`}
        detail="Where the clip shown while a pointer rests on the card is cut from."
      />

      <DialogContent>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <TrickplayFrame isFluid trickplay={trickplay} seconds={atSeconds} />
            <TrickplayFrame isFluid trickplay={trickplay} seconds={endsAt} />
          </div>

          <RangeSlider
            label="Where the clip starts and ends"
            thumbLabels={['Where the clip starts', 'Where the clip ends']}
            values={[atSeconds, endsAt]}
            max={lastSecond}
            valueLabel={formatDuration}
            onValuesChange={([lower, upper]) => {
              const [start, end] = limitClip(
                Math.floor(lower),
                Math.floor(upper),
                endsAt,
                LONGEST_CLIP_SECONDS,
              );

              setAtSeconds(start);
              setLengthSeconds(end - start);
            }}
          />

          {problem === null ? null : (
            <p role="alert" className="text-sm text-danger">
              {problem}
            </p>
          )}
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: 'Use this moment',
          isDisabled: isSaving,
          onChoose: () => {
            void keep();
          },
        }}
      >
        {current === null ? null : (
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => {
              void backToAutomatic();
            }}
          >
            Back to automatic
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};

PreviewMomentPicker.displayName = 'PreviewMomentPicker';

export { PreviewMomentPicker };
