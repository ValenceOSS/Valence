import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { CUSTOM_WEBHOOK_FORMATS, CUSTOM_WEBHOOK_METHODS } from '@ValenceContracts/schemas/Webhook';
import { DEFAULT_CUSTOM_TEMPLATES } from '@ValenceContracts/constants/DEFAULT_CUSTOM_TEMPLATES';
import type { CustomWebhookFormat } from '@ValenceContracts/schemas/Webhook';
import type { CustomRequestRowsProps } from './CustomRequestRows.types';
import { say } from '@ValenceI18n/say';

const FORMAT_NAMES: Readonly<Record<CustomWebhookFormat, string>> = {
  json: 'JSON',
  text: say('screens.adminArea.customRequestRows.plainText'),
  form: say('screens.adminArea.customRequestRows.form'),
};

/**
 * The Custom service's request settings, as rows of the card saying where a webhook goes: how it is
 * sent, what shape its body takes, and whether it is signed. Each saves as it is changed, and
 * changing between text and structured bodies swaps an untouched default template for the other.
 *
 * @param setup - The Custom service's saved setup.
 * @param onChange - Saves a changed setup.
 */
const CustomRequestRows = ({ setup, onChange }: CustomRequestRowsProps) => (
  <>
    <SettingRow
      title={say('screens.adminArea.customRequestRows.method')}
      description={say('screens.adminArea.customRequestRows.howEachMessageIsSent')}
    >
      <SegmentedRow
        label={say('screens.adminArea.customRequestRows.method')}
        size="sm"
        items={CUSTOM_WEBHOOK_METHODS.map((method) => ({ id: method, label: method }))}
        value={setup.method}
        onSelect={(id) => {
          const method = CUSTOM_WEBHOOK_METHODS.find((one) => one === id);

          if (method !== undefined && method !== setup.method) {
            onChange({ ...setup, method });
          }
        }}
      />
    </SettingRow>
    <SettingRow
      title={say('screens.adminArea.customRequestRows.bodyFormat')}
      description={say('screens.adminArea.customRequestRows.alsoSetsTheContentTypeHeader')}
    >
      <SelectField
        label={say('screens.adminArea.customRequestRows.bodyFormat')}
        isLabelHidden
        size="sm"
        className="w-96 max-w-full"
        options={CUSTOM_WEBHOOK_FORMATS.map((format) => ({
          id: format,
          label: FORMAT_NAMES[format],
        }))}
        value={setup.format}
        onSelect={(id) => {
          const format = CUSTOM_WEBHOOK_FORMATS.find((one) => one === id);

          if (format === undefined || format === setup.format) {
            return;
          }

          onChange({
            ...setup,
            format,
            template:
              setup.template === DEFAULT_CUSTOM_TEMPLATES[setup.format]
                ? DEFAULT_CUSTOM_TEMPLATES[format]
                : setup.template,
          });
        }}
      />
    </SettingRow>
    <SettingRow
      title={say('screens.adminArea.customRequestRows.signEachMessage')}
      description={say('screens.adminArea.customRequestRows.addsAnXValenceSignatureHeader')}
    >
      <Switch
        label={say('screens.adminArea.customRequestRows.signEachMessage')}
        isLabelHidden
        isOn={setup.isSigned}
        onToggle={() => {
          onChange({ ...setup, isSigned: !setup.isSigned });
        }}
      />
    </SettingRow>
  </>
);

CustomRequestRows.displayName = 'CustomRequestRows';

export { CustomRequestRows };
