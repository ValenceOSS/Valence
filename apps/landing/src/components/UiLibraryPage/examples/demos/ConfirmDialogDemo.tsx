import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';

/**
 * A destructive action that asks before it acts, so the confirming dialog can be opened, answered
 * and dismissed.
 */
const ConfirmDialogDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Remove library
      </Button>

      <ConfirmDialog
        title="Remove this library?"
        detail="The files stay where they are. Only Valence forgets them."
        confirmLabel="Remove"
        isDestructive
        isOpen={isOpen}
        onClose={close}
        onConfirm={close}
      />
    </>
  );
};

ConfirmDialogDemo.displayName = 'ConfirmDialogDemo';

export { ConfirmDialogDemo };
