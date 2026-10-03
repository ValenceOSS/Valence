import { useZodForm } from '@ValenceClient/forms/useZodForm';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { DAY_NAMES } from '@ValenceClient/admin/describeTrigger';
import { AddTriggerFormSchema } from './AddTriggerFormSchema';
import { INTERVAL_UNITS } from './INTERVAL_UNITS';
import { TRIGGER_TYPES } from './TRIGGER_TYPES';
import type { AddTriggerDialogProps } from './AddTriggerDialog.types';
import { say } from '@ValenceI18n/say';

const DAYS = DAY_NAMES.map((name, index) => ({ id: index.toString(), label: name }));

/**
 * Adds one trigger to a job: pick what kind it is — daily, weekly, on an interval, or when the server
 * starts — and then answer only what that kind needs, rather than being shown every field a trigger
 * of any kind could have.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onAdd - Called with the trigger that was described.
 * @param onClose - Called when it is dismissed.
 * @param isSaving - Whether a trigger is being written, which holds the dialog open and inert.
 */
const AddTriggerDialog = ({ isOpen, onAdd, onClose, isSaving = false }: AddTriggerDialogProps) => {
  const form = useZodForm(
    AddTriggerFormSchema,
    { type: 'daily', time: '03:00', dayOfWeek: '0', every: '6', unit: 'hours' },
    (trigger) => {
      onAdd(trigger);

      return null;
    },
  );
  const { type, unit } = form.values;

  return (
    <DialogCompanion label={say('common.addTrigger')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={say('common.addTrigger')} />

      <Form label={say('common.addTrigger')} onSubmit={form.submit} isDialog>
        <DialogContent className="flex flex-col gap-5">
          <SelectField
            label={say('screens.adminArea.addTriggerDialog.triggerType')}
            options={[...TRIGGER_TYPES]}
            value={type}
            onSelect={(id) => {
              form.set('type', TRIGGER_TYPES.find((one) => one.id === id)?.id ?? 'daily');
            }}
          />

          {type === 'weekly' ? (
            <SelectField
              label={say('screens.adminArea.addTriggerDialog.day')}
              options={DAYS}
              value={form.values.dayOfWeek}
              onSelect={(id) => {
                form.set('dayOfWeek', id);
              }}
            />
          ) : null}

          {type === 'daily' || type === 'weekly' ? (
            <TextField label={say('common.time')} type="time" {...form.text('time')} />
          ) : null}

          {type === 'interval' ? (
            <div className="grid grid-cols-2 items-start gap-3">
              <TextField
                label={say('screens.adminArea.addTriggerDialog.every')}
                type="number"
                min={1}
                max={unit === 'minutes' ? 59 : 23}
                {...form.text('every')}
              />

              <SelectField
                label={say('screens.adminArea.addTriggerDialog.unit')}
                options={[...INTERVAL_UNITS]}
                value={unit}
                onSelect={(id) => {
                  form.set('unit', INTERVAL_UNITS.find((one) => one.id === id)?.id ?? 'hours');
                }}
              />
            </div>
          ) : null}

          {type === 'startup' ? (
            <p className="font-body text-sm text-text-muted">
              {say('screens.adminArea.addTriggerDialog.runsOnceEveryTimeTheServer')}
            </p>
          ) : null}
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose, isDisabled: isSaving }}
          confirm={{
            label: say('common.add'),
            isSubmit: true,
            isDisabled: isSaving,
            isLoading: isSaving,
          }}
        />
      </Form>
    </DialogCompanion>
  );
};

AddTriggerDialog.displayName = 'AddTriggerDialog';

export { AddTriggerDialog };
