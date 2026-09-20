import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Slider } from '@ValenceUI/Slider';
import { TextField } from '@ValenceUI/TextField';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { clearPreviewMoment, setPreviewMoment } from '@ValenceClient/library/fetchLibrary';
import { fetchTrickplay } from '@ValenceScreens/playback/fetchTrickplay';
import { TrickplayPreview } from '@ValenceScreens/components/VideoPlayer/components/TrickplayPreview/TrickplayPreview';
import type { Trickplay } from '@ValenceScreens/playback/fetchTrickplay';
import type { PreviewMomentPickerProps } from './PreviewMomentPicker.types';

const AUTOMATIC_POSITION = 0.2;

const DEFAULT_CLIP_SECONDS = 24;

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
 * Reads the clip length somebody typed, where they typed one.
 *
 * @param typed - What is in the field.
 * @returns The seconds, null for a blank field, or undefined where it is not a length at all.
 */
const readClipLength = (typed: string): number | null | undefined => {
  if (typed.trim() === '') {
    return null;
  }

  const seconds = Number.parseInt(typed, 10);

  return Number.isInteger(seconds) && seconds > 0 && seconds.toString() === typed.trim()
    ? seconds
    : undefined;
};

/**
 * Chooses where an item's hover preview clip comes from, instead of the fixed fraction the media
 * service guesses at. The guess lands on title cards, black frames and spoilers often enough that
 * somebody who knows the film wants to point at the shot that sells it — so this is a scrub across
 * the film with the thumbnail at each moment, and one press to keep the one under the handle.
 *
 * The frame under the handle is drawn on its own as well as under the pointer, since a chosen moment
 * that is only visible while hovering is not much of a choice to look at. Going back to automatic is
 * offered only where a moment was chosen, so the dialog never offers to undo what nobody did.
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
  const [clipLength, setClipLength] = useState(currentLength?.toString() ?? '');
  const [trickplay, setTrickplay] = useState<Trickplay | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAtSeconds(currentAt ?? automaticMoment(durationSeconds));
    setClipLength(currentLength?.toString() ?? '');
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

  const lengthSeconds = readClipLength(clipLength);
  const isLengthWrong = lengthSeconds === undefined;
  const lastSecond = Math.max(Math.floor(durationSeconds) - 1, 0);

  const keep = async () => {
    if (isLengthWrong) {
      return;
    }

    setIsSaving(true);
    setProblem(null);

    const answer = await setPreviewMoment(mediaId, {
      atSeconds,
      durationSeconds: lengthSeconds,
    });

    setIsSaving(false);

    if ('problem' in answer) {
      setProblem(answer.problem);

      return;
    }

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
          <div className="flex justify-center">
            <TrickplayPreview trickplay={trickplay} seconds={atSeconds} />
          </div>

          <Slider
            label="Where the clip starts"
            value={atSeconds}
            max={lastSecond}
            onValueChange={(next) => {
              setAtSeconds(Math.floor(next));
            }}
            renderPreview={(value) => (
              <TrickplayPreview trickplay={trickplay} seconds={Math.floor(value)} />
            )}
            valueLabel={formatDuration}
          />

          <TextField
            label="Clip length, in seconds"
            type="number"
            min={1}
            value={clipLength}
            onValueChange={setClipLength}
            placeholder={DEFAULT_CLIP_SECONDS.toString()}
            description="Leave it blank for the usual length."
            {...(isLengthWrong ? { error: 'Say how many seconds, or leave it blank.' } : {})}
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
          isDisabled: isSaving || isLengthWrong,
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
