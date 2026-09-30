import { GAP } from './GAP';

/**
 * The names of the gaps a piece of text leaves for the app to fill, each once, in order.
 *
 * @param text - Words with `{name}` gaps in them.
 */
const gapsIn = (text: string): string[] => [
  ...new Set(Array.from(text.matchAll(GAP), (match) => match[1] ?? '')),
];

export { gapsIn };
