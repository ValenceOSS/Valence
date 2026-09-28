import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { changePlugin } from '@ValenceClient/plugins/changePlugin';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { PluginSettingsDialogProps } from './PluginSettingsDialog.types';

/**
 * A plugin's settings, such as the keys it signs in to another service with. A secret is never shown
 * again once saved: its field starts empty, says whether one is set, and only what is typed into it
 * is sent, so leaving it alone keeps what the server holds.
 *
 * @param plugin - The plugin, or nothing while the dialog is shut.
 * @param onClose - Told it was dismissed.
 * @param onSaved - Told the settings were saved.
 */
const PluginSettingsDialog = ({ plugin, onClose, onSaved }: PluginSettingsDialogProps) => {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues(
      Object.fromEntries(
        (plugin?.settings ?? []).map((setting) => [
          setting.id,
          setting.kind === 'toggle'
            ? setting.value === true
            : setting.kind === 'secret'
              ? ''
              : typeof setting.value === 'string'
                ? setting.value
                : '',
        ]),
      ),
    );
  }, [plugin]);

  return (
    <Dialog label="Plugin settings" isOpen={plugin !== null} onClose={onClose}>
      {plugin === null ? null : (
        <>
          <DialogTitle title={`${plugin.name} settings`} />

          <DialogContent className="flex flex-col gap-4">
            {plugin.settings.map((setting) => {
              const value = values[setting.id];

              return setting.kind === 'toggle' ? (
                <div key={setting.id} className="flex flex-col gap-1">
                  <Switch
                    label={setting.label}
                    isOn={value === true}
                    onToggle={() => {
                      setValues((was) => ({ ...was, [setting.id]: was[setting.id] !== true }));
                    }}
                  />

                  {setting.help === null ? null : (
                    <span className="text-xs text-text-muted">{setting.help}</span>
                  )}
                </div>
              ) : (
                <TextField
                  key={setting.id}
                  label={setting.label}
                  type={setting.kind === 'secret' ? 'password' : 'text'}
                  autoComplete={setting.kind === 'secret' ? 'new-password' : 'off'}
                  value={typeof value === 'string' ? value : ''}
                  {...(setting.kind === 'secret' && setting.isSet
                    ? { placeholder: 'Saved. Type to replace it.' }
                    : {})}
                  {...(setting.help === null ? {} : { description: setting.help })}
                  onValueChange={(next) => {
                    setValues((was) => ({ ...was, [setting.id]: next }));
                  }}
                />
              );
            })}
          </DialogContent>

          <DialogFooter
            dismiss={{ onChoose: onClose }}
            confirm={{
              label: 'Save',
              isLoading: isSaving,
              onChoose: () => {
                const settings = Object.fromEntries(
                  plugin.settings
                    .filter((setting) => setting.kind !== 'secret' || values[setting.id] !== '')
                    .map((setting) => [setting.id, values[setting.id] ?? '']),
                );

                setIsSaving(true);

                void changePlugin(plugin.id, { settings })
                  .then(() => {
                    tellOutcome(`Saved ${plugin.name}’s settings.`, null);
                    onSaved();
                  })
                  .catch((problem: Error) => {
                    tellOutcome('', problem.message);
                  })
                  .finally(() => {
                    setIsSaving(false);
                  });
              },
            }}
          />
        </>
      )}
    </Dialog>
  );
};

PluginSettingsDialog.displayName = 'PluginSettingsDialog';

export { PluginSettingsDialog };
