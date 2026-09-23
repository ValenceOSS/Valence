import { load } from 'cheerio';
import { createCategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import { settingsOf } from '@ValenceRequests/cardigann/settingsOf';
import { isSecretSetting } from '@ValenceRequests/definitions/isSecretSetting';
import { summariseDefinition } from '@ValenceRequests/definitions/summariseDefinition';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type {
  IndexerDefinitionDetail,
  IndexerDefinitionSetting,
} from '@ValenceContracts/schemas/IndexerDefinition';

const GUIDANCE: Readonly<Record<string, string>> = {
  info_cookie:
    'Sign in to the site in a browser, open its developer tools, and copy the Cookie header a page request sends. Paste the whole value here.',
  info_flaresolverr:
    'This site sits behind Cloudflare’s browser check. The requests service gets past it with a browser of its own, so its first search can take a few seconds longer.',
  info_useragent:
    'Some sites tie a cookie to the browser that got it. Copy your browser’s user agent too, where the site asks for one.',
  info_category_8000:
    'Some of this site’s results have no category it recognises, so they appear as Other.',
};

/**
 * Writes text a definition gave as HTML — links and emphasis, mostly — as plain text.
 *
 * @param html - The text.
 * @returns It without markup.
 */
const plain = (html: string): string => load(`<div>${html}</div>`)('div').first().text().trim();

/**
 * Says what one setting asks for, the way the add-indexer form draws it.
 *
 * @param setting - The setting as the definition writes it.
 * @returns The setting.
 */
const describeSetting = (
  setting: ReturnType<typeof settingsOf>[number],
): IndexerDefinitionSetting => {
  const isInfo = setting.type.toLowerCase().startsWith('info');
  const kind = isInfo
    ? 'info'
    : setting.type === 'password' || setting.type === 'checkbox' || setting.type === 'select'
      ? setting.type
      : 'text';
  const options = Object.entries(setting.options ?? {}).map(([value, label]) => ({ value, label }));

  return {
    name: setting.name,
    kind,
    label: setting.label === '' ? setting.name : plain(setting.label),
    detail: isInfo ? (GUIDANCE[setting.type.toLowerCase()] ?? plain(setting.default ?? '')) : null,
    default:
      kind === 'checkbox'
        ? setting.default === 'true'
        : kind === 'select'
          ? (setting.default ?? options[0]?.value ?? null)
          : isInfo
            ? null
            : (setting.default ?? null),
    options,
    isSecret: isSecretSetting(setting),
  };
};

/**
 * Says everything the add-indexer form needs of a definition: what it is, the addresses it answers
 * at, the settings it asks for, the kinds of thing it has, and whether logging in shows a captcha or
 * the site sits behind Cloudflare's browser check.
 *
 * @param definition - The definition.
 * @returns The detail.
 */
const describeDefinition = (definition: CardigannDefinition): IndexerDefinitionDetail => {
  const { id, name, description, language, privacy, protocol, categories } = summariseDefinition(
    definition,
    '',
    '',
    '',
  );
  const settings = settingsOf(definition);

  return {
    id,
    name,
    description,
    language,
    privacy,
    protocol,
    categories,
    links: definition.links,
    settings: settings.map(describeSetting),
    standardCategories: createCategoryMap(definition.caps).standard(),
    hasCaptcha: definition.login?.captcha !== undefined,
    isBehindCloudflare: settings.some(
      (setting) => setting.type.toLowerCase() === 'info_flaresolverr',
    ),
  };
};

export { describeDefinition };
