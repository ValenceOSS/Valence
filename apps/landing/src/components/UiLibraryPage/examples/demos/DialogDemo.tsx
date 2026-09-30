import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';

/**
 * A button that opens a real dialog, with a title, some content and a footer that closes it, so the
 * dialog, its content area and its footer can be seen working together.
 */
const DialogDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

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

      <Dialog label="Add a library" isOpen={isOpen} onClose={close}>
        <DialogTitle title="Add a library" detail="Point Valence at a folder of films." />
        <DialogContent>
          <p className="text-sm text-text-muted">
            Everything in the folder is read where it is. Nothing is moved, renamed or rewritten.
          </p>
        </DialogContent>
        <DialogFooter
          dismiss={{ onChoose: close }}
          confirm={{ label: 'Add library', onChoose: close }}
        />
      </Dialog>
    </>
  );
};

DialogDemo.displayName = 'DialogDemo';

export { DialogDemo };
