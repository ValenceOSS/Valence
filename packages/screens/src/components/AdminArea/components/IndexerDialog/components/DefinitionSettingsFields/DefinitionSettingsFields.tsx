import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { TextField } from '@ValenceUI/TextField';
import type { DefinitionSettingsFieldsProps } from './DefinitionSettingsFields.types';
import { say } from '@ValenceI18n/say';

/**
 * The settings a site's definition asks for, each drawn as what it is: a text field, a password
 * field, a box to tick, a choice from a list, or a note to read. A secret already kept shows as kept
 * rather than as its value, and is only replaced when somebody types a new one.
 *
 * @param settings - What the definition asks for.
 * @param values - What has been given so far.
 * @param secretsSet - The secrets already kept.
 * @param onChange - Told a setting's new value.
 */
const DefinitionSettingsFields = ({
  settings,
  values,
  secretsSet,
  onChange,
}: DefinitionSettingsFieldsProps) => (
  <div className="flex flex-col gap-4">
    {settings.map((setting) => {
      const value = values[setting.name] ?? setting.default;

      switch (setting.kind) {
        case 'info':
          return setting.detail === null || setting.detail === '' ? null : (
            <p
              key={setting.name}
              className="rounded-lg bg-[var(--surface-hover)] px-3 py-2 text-xs text-text-muted"
            >
              {setting.label === setting.name ? null : (
                <span className="font-medium text-text">{setting.label}. </span>
              )}
              {setting.detail}
            </p>
          );
        case 'checkbox':
          return (
            <Checkbox
              key={setting.name}
              label={setting.label}
              checked={value === true}
              onCheckedChange={(checked) => {
                onChange(setting.name, checked);
              }}
            />
          );
        case 'select': {
          const chosen = typeof value === 'string' ? value : '';

          return (
            <FormField key={setting.name} label={setting.label}>
              <OptionMenu
                label={setting.label}
                triggerShape="field"
                matchTriggerWidth
                groups={[
                  {
                    name: setting.label,
                    selectedId: chosen,
                    onSelect: (next) => {
                      onChange(setting.name, next);
                    },
                    options: setting.options.map((option) => ({
                      id: option.value,
                      label: option.label,
                    })),
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">
                      {setting.options.find((option) => option.value === chosen)?.label ?? chosen}
                    </span>
                    <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
                  </>
                }
              />
            </FormField>
          );
        }
        case 'text':
        case 'password': {
          const isKept = setting.isSecret && secretsSet.includes(setting.name);

          return (
            <TextField
              key={setting.name}
              label={setting.label}
              type={setting.kind === 'password' || setting.isSecret ? 'password' : 'text'}
              value={typeof value === 'string' ? value : ''}
              onValueChange={(next) => {
                onChange(setting.name, next);
              }}
              {...(isKept
                ? {
                    description: say('admin.definitionSettingsFields.kept'),
                  }
                : {})}
              autoComplete="off"
            />
          );
        }
      }
    })}
  </div>
);

DefinitionSettingsFields.displayName = 'DefinitionSettingsFields';

export { DefinitionSettingsFields };
