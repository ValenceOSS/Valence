import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import type { ChooseQualityDialogProps } from './ChooseQualityDialog.types';

/**
 * Asks which quality to look for, once somebody has said they want something.
 *
 * Choosing is the whole dialog, so a choice is the confirmation: tapping a quality asks for the
 * title at it. A list of qualities to pick from followed by a button saying "Ask" would be two
 * taps to answer a question with one answer, and the second tap decides nothing.
 *
 * The qualities are shown rather than folded into a menu, for the same reason: the dialog exists
 * to put a short list in front of somebody, and hiding that list behind another tap would leave
 * the dialog doing nothing at all.
 *
 * Only ever opened where there is a real choice. One quality, or a server that asks at one quality
 * and no other, goes straight to asking — see [`AskableDialog`].
 *
 * @param title - What is being asked for.
 * @param choices - The qualities on offer.
 * @param isOpen - Whether it is showing.
 * @param isAsking - Whether a choice is being sent, which holds the buttons.
 * @param onChoose - Called with the quality chosen.
 * @param onClose - Called when it is dismissed.
 */
const ChooseQualityDialog = ({
  title,
  choices,
  isOpen,
  isAsking,
  onChoose,
  onClose,
}: ChooseQualityDialogProps) => (
  <Dialog label={`Which quality for ${title}?`} isOpen={isOpen} onClose={onClose}>
    <DialogTitle title={`Ask for ${title}`} detail="We’ll fetch the best release that fits." />

    <DialogContent>
      <ul className="flex flex-col gap-2">
        {choices.map((choice) => (
          <li key={choice.id}>
            <Button
              variant="secondary"
              className="w-full justify-start"
              disabled={isAsking}
              onClick={() => {
                onChoose(choice.id);
              }}
            >
              {choice.name}
            </Button>
          </li>
        ))}
      </ul>
    </DialogContent>

    <DialogFooter dismiss={{ onChoose: onClose }} />
  </Dialog>
);

ChooseQualityDialog.displayName = 'ChooseQualityDialog';

export { ChooseQualityDialog };
