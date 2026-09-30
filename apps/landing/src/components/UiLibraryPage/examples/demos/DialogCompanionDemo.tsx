import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';

/**
 * A dialog that opens a companion beside itself, the way a title's dialog opens a person's, so the
 * two can be seen standing together and closing in turn.
 */
const DialogCompanionDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open a dialog
      </Button>

      <Dialog
        label="Arrival"
        isOpen={isOpen}
        onClose={() => {
          setIsCompanionOpen(false);
          setIsOpen(false);
        }}
      >
        <DialogTitle title="Arrival" detail="2016 · 1 h 56 min" />
        <DialogContent>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCompanionOpen(true);
            }}
          >
            Open its companion
          </Button>
        </DialogContent>
      </Dialog>

      <DialogCompanion
        label="Amy Adams"
        isOpen={isCompanionOpen}
        onClose={() => {
          setIsCompanionOpen(false);
        }}
      >
        <DialogTitle title="Amy Adams" detail="Louise Banks" />
        <DialogContent>
          <p className="text-sm text-text-muted">A companion opens over the dialog it came from.</p>
        </DialogContent>
      </DialogCompanion>
    </>
  );
};

DialogCompanionDemo.displayName = 'DialogCompanionDemo';

export { DialogCompanionDemo };
