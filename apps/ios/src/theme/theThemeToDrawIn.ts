/**
 * Which of the two themes to draw in, for whatever the phone said about itself.
 *
 * Anything that is not plainly light is drawn dark: a phone that will not say, or says something
 * neither of these, is most likely in a room with a film playing in it.
 *
 * @param scheme - What the phone said, where it said anything.
 * @returns The theme to draw in.
 */
const theThemeToDrawIn = (scheme: string | null | undefined): 'light' | 'dark' =>
  scheme === 'light' ? 'light' : 'dark';

export { theThemeToDrawIn };
