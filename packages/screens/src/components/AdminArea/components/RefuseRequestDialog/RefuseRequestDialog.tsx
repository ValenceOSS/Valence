import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { refuseMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import type { RefuseRequestDialogProps } from './RefuseRequestDialog.types';

/**
 * Refuses a request, with a reason for whoever asked where there is one worth giving.
 *
 * @param request - The request, or nothing while the dialog is closed.
 * @param onClose - Called when it is dismissed.
 * @param onRefused - Told the request once it is refused.
 */
const RefuseRequestDialog = ({ request, onClose, onRefused }: RefuseRequestDialogProps) => {
  const [reason, setReason] = useState('');
  const [isRefusing, setIsRefusing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const title = `Refuse ${request?.title ?? 'this request'}?`;

  const refuse = () => {
    if (request === null) {
      return;
    }

    setIsRefusing(true);
    setProblem(null);

    void refuseMediaRequest(request.id, reason)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? 'It could not be refused.');

          return;
        }

        setReason('');
        onRefused(value);
        onClose();
      })
      .finally(() => {
        setIsRefusing(false);
      });
  };

  return (
    <DialogCompanion label={title} isOpen={request !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail="Nothing is fetched for it. It can still be approved later."
      />

      <DialogContent>
        <TextField
          label="Why"
          value={reason}
          onValueChange={setReason}
          placeholder="Optional"
          description={`Shown to ${request?.requestedBy.name ?? 'whoever asked'}.`}
        />
      </DialogContent>

      <DialogFooter>
        {problem === null ? null : (
          <span role="alert" className="mr-auto text-sm text-danger">
            {problem}
          </span>
        )}

        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button variant="danger" isLoading={isRefusing} onClick={refuse}>
          Refuse
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

RefuseRequestDialog.displayName = 'RefuseRequestDialog';

export { RefuseRequestDialog };
