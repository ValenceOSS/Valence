import { useState } from 'react';
import { X as XIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { changeLiveGuide } from '@ValenceClient/live/changeLiveGuide';
import { GuideAddressesSchema } from '@ValenceContracts/schemas/LiveTv';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { GuideSuggestions } from '@ValenceScreens/components/AdminArea/components/LiveTvPanel/components/GuideSuggestions/GuideSuggestions';
import { say } from '@ValenceI18n/say';
import type { LiveGuideDialogProps } from './LiveGuideDialog.types';

/**
 * Changes the programme guides a live TV source reads what is on from — one address or several,
 * the free ones a click away — and reads the source again with them.
 *
 * @param source - The source, or nothing while the dialog is lowered.
 * @param onClose - Told to lower it.
 * @param onChanged - Told once the guides are changed.
 */
const LiveGuideDialog = ({ source, onClose, onChanged }: LiveGuideDialogProps) => {
  const [guides, setGuides] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (source !== null && editing !== source.id) {
    setEditing(source.id);
    setGuides(source.guideUrl ?? '');
    setProblem(null);
  }

  const save = () => {
    const parsed = GuideAddressesSchema.safeParse(guides);

    if (source === null || !parsed.success) {
      setProblem(say('screens.adminArea.liveTvPanel.thoseAreNotAllAddresses'));

      return;
    }

    setIsSaving(true);

    void changeLiveGuide(source.id, parsed.data)
      .then((sent) => {
        if (
          tellOutcome(
            say('screens.adminArea.liveTvPanel.readNameCountChannels', {
              name: source.name,
              count: String(sent.value?.channelCount ?? 0),
            }),
            failureOfRefusal(sent.refusal),
          )
        ) {
          onChanged();
          onClose();
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      label={say('screens.adminArea.liveTvPanel.guideAddresses')}
      isOpen={source !== null}
      onClose={onClose}
    >
      <DialogTitle title={say('screens.adminArea.liveTvPanel.guideAddresses')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('screens.adminArea.liveTvPanel.guideAddresses')}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        isDialog
      >
        <DialogContent>
          <div className="flex flex-col gap-4">
            <TextField
              label={say('screens.adminArea.liveTvPanel.guideAddresses')}
              value={guides}
              onValueChange={setGuides}
              description={say('screens.adminArea.liveTvPanel.oneOrMoreXmltvGuides')}
            />
            <GuideSuggestions
              chosen={guides}
              onAdd={(address) => {
                setGuides((was) => `${was.trim()} ${address}`.trim());
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
          confirm={{ label: say('common.save'), isSubmit: true, isLoading: isSaving }}
        />
      </Form>
    </Dialog>
  );
};

LiveGuideDialog.displayName = 'LiveGuideDialog';

export { LiveGuideDialog };
