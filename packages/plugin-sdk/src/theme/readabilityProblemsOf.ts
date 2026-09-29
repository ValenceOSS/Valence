import { contrastRatio } from './contrastRatio';
import type { ThemeTokens } from './ThemeTokensSchema';

const PAIRS = [
  ['text', 'surface', 4.5],
  ['text', 'surfaceRaised', 4.5],
  ['textMuted', 'surface', 3],
  ['accentContrast', 'accent', 4.5],
  ['danger', 'surface', 3],
] as const;

/**
 * What would be hard to read in a set of theme colours, so a theme that looks broken is refused
 * rather than applied.
 *
 * @param tokens - One scheme of a theme.
 * @returns A sentence for each pair that is too close in brightness; none where it reads well.
 */
const readabilityProblemsOf = (tokens: ThemeTokens): string[] =>
  PAIRS.flatMap(([ink, paper, least]) => {
    const ratio = contrastRatio(tokens[ink], tokens[paper]);

    return ratio >= least
      ? []
      : [`${ink} on ${paper} is ${ratio.toFixed(2)}:1, and needs at least ${least.toString()}:1`];
  });

export { readabilityProblemsOf };
