import { useEffect, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { Form } from '@ValenceUI/Form';
import { Link } from '@ValenceUI/Link';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { changePlugin } from '@ValenceClient/plugins/changePlugin';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import type { PluginSettingsDialogProps } from './PluginSettingsDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * A plugin's settings, such as the keys it signs in to another service with. A secret is never shown
 * again once saved: its field starts empty, says whether one is set, and only what is typed into it
 * is sent, so leaving it alone keeps what the server holds. A setting whose help names where its
 * value comes from links there, under the help, so it can be opened rather than typed in.
 *
 * @param plugin - The plugin, or nothing while the dialog is shut.
 * @param redirectUri - Where outside services send somebody back to after they connect an account,
 *   shown to copy for a plugin that connects them.
 * @param onClose - Told it was dismissed.
 * @param onSaved - Told the settings were saved.
 */
const PluginSettingsDialog = ({
  plugin,
  redirectUri,
  onClose,
  onSaved,
}: PluginSettingsDialogProps) => {
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
    <Dialog
      label={say('screens.pluginsPanel.pluginSettingsDialog.pluginSettings')}
      isOpen={plugin !== null}
      onClose={onClose}
    >
      {plugin === null ? null : (
        <>
          <DialogTitle title={say('common.nameSettings', { name: plugin.name })} />

          <Form
            label={say('common.nameSettings', { name: plugin.name })}
            onSubmit={(event) => {
              event.preventDefault();

              const settings = Object.fromEntries(
                plugin.settings
                  .filter((setting) => setting.kind !== 'secret' || values[setting.id] !== '')
                  .map((setting) => [setting.id, values[setting.id] ?? '']),
              );

              setIsSaving(true);

              void changePlugin(plugin.id, { settings })
                .then(() => {
                  tellOutcome(
                    say('screens.pluginsPanel.pluginSettingsDialog.savedNameSSettings', {
                      name: plugin.name,
                    }),
                    null,
                  );
                  onSaved();
                })
                .catch((problem: Error) => {
                  tellOutcome('', problem.message);
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
            isDialog
          >
            <DialogContent className="flex flex-col gap-4">
              {redirectUri === null ||
              !plugin.permissions.some((permission) => permission.kind === 'accounts') ? null : (
                <CopyableAddress
                  title={say('screens.pluginsPanel.pluginSettingsDialog.redirectAddress')}
                  detail={say(
                    'screens.pluginsPanel.pluginSettingsDialog.giveThisToEachServiceWhen',
                  )}
                  address={redirectUri}
                />
              )}

              {plugin.webhooks.map((hook) => (
                <CopyableAddress
                  key={hook.id}
                  title={hook.title}
                  detail={say(
                    'screens.pluginsPanel.pluginSettingsDialog.giveThisWebhookAddressToThe',
                  )}
                  address={hook.url}
                />
              ))}

              {plugin.settings.map((setting) => {
                const value = values[setting.id];
                const link =
                  setting.link === null ? null : (
                    <Link href={setting.link.url} className="self-start text-xs">
                      {setting.link.label}
                    </Link>
                  );

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

                    {link}
                  </div>
                ) : (
                  <div key={setting.id} className="flex flex-col gap-1">
                    <TextField
                      label={setting.label}
                      type={setting.kind === 'secret' ? 'password' : 'text'}
                      autoComplete={setting.kind === 'secret' ? 'new-password' : 'off'}
                      value={typeof value === 'string' ? value : ''}
                      {...(setting.kind === 'secret' && setting.isSet
                        ? {
                            placeholder: say(
                              'screens.pluginsPanel.pluginSettingsDialog.savedTypeToReplaceIt',
                            ),
                          }
                        : {})}
                      {...(setting.help === null ? {} : { description: setting.help })}
                      {...(link === null ? {} : { descriptionPlacement: 'below' as const })}
                      onValueChange={(next) => {
                        setValues((was) => ({ ...was, [setting.id]: next }));
                      }}
                    />

                    {link}
                  </div>
                );
              })}
            </DialogContent>

            <DialogFooter
              dismiss={{ onChoose: onClose }}
              confirm={{
                label: say('common.save'),
                isLoading: isSaving,
                isSubmit: true,
              }}
            />
          </Form>
        </>
      )}
    </Dialog>
  );
};

PluginSettingsDialog.displayName = 'PluginSettingsDialog';

export { PluginSettingsDialog };
