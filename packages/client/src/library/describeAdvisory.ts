import type { Advisory } from '@ValenceContracts/schemas/Advisory';
import { say } from '@ValenceI18n/say';

const NAMES: Readonly<Record<Advisory, () => string>> = {
  violence: () => say('client.library.describeAdvisory.violence'),
  language: () => say('client.library.describeAdvisory.language'),
  sex: () => say('client.library.describeAdvisory.sex'),
  nudity: () => say('client.library.describeAdvisory.nudity'),
  drugs: () => say('client.library.describeAdvisory.drugs'),
  frightening: () => say('client.library.describeAdvisory.frightening'),
  discrimination: () => say('client.library.describeAdvisory.discrimination'),
};

/**
 * Names what a title contains, as a viewer reads it before choosing to watch.
 *
 * @param advisory - What it contains.
 * @returns What to call it.
 */
const describeAdvisory = (advisory: Advisory): string => NAMES[advisory]();

export { describeAdvisory };
