import { NAME_MAX } from '@ValenceContracts/schemas/ViewerProfile';

const ELLIPSIS = '…';

const LETTERS = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Shortens a name to the most a profile's name may hold, measured as the profile schema measures
 * it, cutting only between whole characters as a person sees them and ending with an ellipsis where
 * it was cut, so an account's own longer name can stand on the way in without the apps refusing
 * the list.
 *
 * @param name - The name to fit.
 * @returns The name, or as much of it as fits followed by an ellipsis.
 */
const fitProfileName = (name: string): string => {
  if (name.length <= NAME_MAX) {
    return name;
  }

  let kept = '';

  for (const { segment } of LETTERS.segment(name)) {
    if (kept.length + segment.length + ELLIPSIS.length > NAME_MAX) {
      break;
    }

    kept += segment;
  }

  return `${kept.trimEnd()}${ELLIPSIS}`;
};

export { fitProfileName };
