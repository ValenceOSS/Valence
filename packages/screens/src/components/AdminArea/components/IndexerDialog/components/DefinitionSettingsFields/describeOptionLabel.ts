import { say } from '@ValenceI18n/say';

const NAMED: Readonly<Record<string, string>> = {
  asc: say('screens.definitionSettingsFields.describeOptionLabel.ascending'),
  desc: say('screens.definitionSettingsFields.describeOptionLabel.descending'),
};

/**
 * Names one choice of a site setting for a person, where the definition gives only the value it
 * sends — `desc`, `created` — as its label.
 *
 * @param label - The label as the definition gives it.
 * @returns The label to show.
 */
const describeOptionLabel = (label: string): string => {
  const named = NAMED[label.trim().toLowerCase()];

  if (named !== undefined) {
    return named;
  }

  return label === '' ? label : `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

export { describeOptionLabel };
