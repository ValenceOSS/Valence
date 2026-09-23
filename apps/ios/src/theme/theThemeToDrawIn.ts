import type { Theme } from '@ValenceClient/shell/theme';

/**
 * Which of the two themes to draw in, given what somebody asked for and what the phone says about
 * itself.
 *
 * Somebody who chose a theme gets it, on any phone. Somebody who chose to follow the machine — which
 * is the default, and a real choice rather than the absence of one — gets whatever the phone is in.
 *
 * A phone that will not say, or says something neither of these, is drawn dark: it is the answer
 * that suits a room with a film playing in it, and the one Valence opened with before it asked.
 *
 * @param chosen - What somebody asked for.
 * @param scheme - What the phone said about itself, where it said anything.
 * @returns The theme to draw in.
 */
const theThemeToDrawIn = (chosen: Theme, scheme: string | null | undefined): 'light' | 'dark' => {
  if (chosen === 'light' || chosen === 'dark') {
    return chosen;
  }

  return scheme === 'light' ? 'light' : 'dark';
};

export { theThemeToDrawIn };
