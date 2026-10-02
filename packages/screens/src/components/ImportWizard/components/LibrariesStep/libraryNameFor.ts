import { say } from '@ValenceI18n/say';

/**
 * What to call the Valence library made for one folder of a library on the old server: its own
 * name where it has one folder, and numbered where it has several.
 *
 * @param name - The library's name on the old server.
 * @param index - Which of its folders this is, from nought.
 * @param count - How many folders it has.
 * @returns The name.
 */
const libraryNameFor = (name: string, index: number, count: number): string =>
  count <= 1
    ? name
    : say('screens.importWizard.libraryNameFor.nameNumber', {
        name,
        number: (index + 1).toString(),
      });

export { libraryNameFor };
