import { settingsOf } from '@ValenceRequests/cardigann/settingsOf';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { IndexerSettings } from '@ValenceRequests/cardigann/IndexerSettings';
import type { TemplateValue } from '@ValenceRequests/cardigann/TemplateVariables';

/**
 * The variables every template of a definition can read: `.Config.` and a setting's name for each
 * setting, `.Config.sitelink` for the address in use, and `.True`, `.False` and `.Today.Year`.
 *
 * A checkbox is `.True` when ticked and unset otherwise, so `{{ if .Config.freeleech }}` reads it. A
 * select is the key of the option chosen. Where a setting was never saved, its default stands in.
 *
 * @param definition - The definition.
 * @param settings - What the indexer was given.
 * @param siteLink - The address in use, ending in a slash.
 * @param nowMs - The time now.
 * @returns The variables.
 */
const configVariables = (
  definition: CardigannDefinition,
  settings: IndexerSettings,
  siteLink: string,
  nowMs: number,
): Record<string, TemplateValue> => {
  const variables: Record<string, TemplateValue> = {
    '.Config.sitelink': siteLink,
    '.True': 'True',
    '.False': null,
    '.Today.Year': new Date(nowMs).getUTCFullYear().toString(),
  };

  for (const setting of settingsOf(definition)) {
    const saved = settings[setting.name];
    const name = `.Config.${setting.name}`;

    switch (setting.type) {
      case 'text':
      case 'password':
        variables[name] = saved === undefined ? (setting.default ?? '') : String(saved);
        break;
      case 'checkbox': {
        const isTicked =
          saved === undefined ? setting.default === 'true' : saved === true || saved === 'true';

        variables[name] = isTicked ? 'True' : null;
        break;
      }
      case 'select': {
        const options = Object.keys(setting.options ?? {});
        const chosen =
          typeof saved === 'string' && options.includes(saved) ? saved : setting.default;

        variables[name] = chosen ?? options[0] ?? null;
        break;
      }
      case 'multi-select':
        variables[name] =
          typeof saved === 'string' ? saved.split(',').filter(Boolean) : (setting.defaults ?? []);
        break;
      default:
        break;
    }
  }

  return variables;
};

export { configVariables };
