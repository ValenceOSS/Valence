import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { spacedName } from '@ValenceCore/releases/spacedName';

const HEARING_IMPAIRED = /(?:^|[\s\-[(])(?:hi|sdh|cc)(?=$|[\s\-\])])/i;

/**
 * Whether a subtitle's release name says it describes sounds as well as speech, the way uploaders
 * mark it when a site's own flag is left unset: `HI`, `SDH` or `CC` after the title, such as
 * `-GalaxyRG-HI` or `en[cc]`. The title itself is never read, so a film called Hi, Mom is not one.
 *
 * @param name - The subtitle's release name.
 * @returns Whether it names itself hearing-impaired.
 */
const namesHearingImpaired = (name: string): boolean => {
  const spaced = spacedName(name);
  const { title } = parseReleaseName(name);
  const at = title === '' ? -1 : spaced.toLowerCase().indexOf(title.toLowerCase());

  return HEARING_IMPAIRED.test(at === -1 ? spaced : spaced.slice(at + title.length));
};

export { namesHearingImpaired };
