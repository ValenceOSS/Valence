import { useState } from 'react';
import { X as XIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { DEFAULT_WEBHOOK_FILTERS, WEBHOOK_PRESETS } from '@ValenceContracts/schemas/Webhook';
import { WEBHOOK_SERVICE_NAMES } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/WEBHOOK_SERVICE_NAMES';
import { webhookAddressProblem } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/webhookAddressProblem';
import { webhookNameProblem } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/webhookNameProblem';
import { say } from '@ValenceI18n/say';
import type { WebhookPreset } from '@ValenceContracts/schemas/Webhook';
import type { NewWebhookDialogProps } from './NewWebhookDialog.types';

/**
 * Starts a webhook with only what it can't exist without, the service and the address, and leaves
 * the events and everything else to its own page.
 *
 * @param isOpen - Whether it is raised.
 * @param onClose - Told to lower it.
 * @param onCreate - Makes the webhook, answering with any refusal.
 */
const NewWebhookDialog = ({ isOpen, onClose, onCreate }: NewWebhookDialogProps) => {
  const [preset, setPreset] = useState<WebhookPreset>('discord');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [reachesLocalNetwork, setReachesLocalNetwork] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const addressProblem = isChecked ? webhookAddressProblem(url) : null;
  const nameProblem = webhookNameProblem(name);
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    setUrl('');
    setName('');
    setReachesLocalNetwork(false);
    setProblem(null);
    setIsChecked(false);
    onClose();
  };

  return (
    <Dialog label={say('common.createWebhook')} isOpen={isOpen} onClose={close}>
      <DialogTitle title={say('common.createWebhook')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={close}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('common.createWebhook')}
        isDialog
        onSubmit={(event) => {
          event.preventDefault();

          setIsChecked(true);

          if (webhookAddressProblem(url) !== null || nameProblem !== null) {
            return;
          }

          setIsSaving(true);
          void onCreate({
            name: name.trim() === '' ? WEBHOOK_SERVICE_NAMES[preset] : name.trim(),
            url: url.trim(),
            preset,
            events: ['job.failed'],
            filters: DEFAULT_WEBHOOK_FILTERS,
            reachesLocalNetwork,
          })
            .then((refusal) => {
              if (refusal === null) {
                close();
              } else {
                setProblem(refusal.message);
              }
            })
            .finally(() => {
              setIsSaving(false);
            });
        }}
      >
        <DialogContent>
          <div className="flex flex-col gap-4">
            <SelectField
              label={say('screens.adminArea.bucketDialog.service')}
              options={WEBHOOK_PRESETS.filter((one) => one !== 'custom').map((one) => ({
                id: one,
                label: WEBHOOK_SERVICE_NAMES[one],
              }))}
              value={preset}
              onSelect={(id) => {
                const picked = WEBHOOK_PRESETS.find((one) => one === id);

                if (picked !== undefined) {
                  setPreset(picked);
                }
              }}
            />
            <TextField
              label={say('common.address')}
              type="url"
              value={url}
              onValueChange={setUrl}
              {...(addressProblem === null ? {} : { error: addressProblem })}
            />
            <TextField
              label={say('common.name')}
              value={name}
              onValueChange={setName}
              description={say('screens.adminArea.newWebhookDialog.leftEmptyItsNamedAfterThe')}
              {...(nameProblem === null ? {} : { error: nameProblem })}
            />
            <SettingList>
              <SettingRow
                title={say('screens.adminArea.webhooksPanel.localNetwork')}
                description={say('screens.adminArea.webhooksPanel.localNetworkDescription')}
              >
                <Switch
                  label={say('screens.adminArea.webhooksPanel.localNetwork')}
                  isLabelHidden
                  isOn={reachesLocalNetwork}
                  onToggle={() => {
                    setReachesLocalNetwork(!reachesLocalNetwork);
                  }}
                />
              </SettingRow>
            </SettingList>
            <p className="text-xs text-text-muted">
              {say('screens.adminArea.newWebhookDialog.itStartsBySendingFailedJobs')}
            </p>
            {problem === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {problem}
              </p>
            )}
          </div>
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: close }}
          confirm={{ label: say('common.create'), isSubmit: true, isLoading: isSaving }}
        />
      </Form>
    </Dialog>
  );
};

NewWebhookDialog.displayName = 'NewWebhookDialog';

export { NewWebhookDialog };
