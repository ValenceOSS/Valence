import { z } from 'zod';
import { SplashScreenWithBrand } from '@ValenceScreens/components/SplashScreenWithBrand/SplashScreenWithBrand';
import { describeProblem } from './describeProblem';
import type { PageProblemProps } from './PageProblem.types';

const ThrownSchema = z.object({ message: z.string() });

/**
 * What is shown where a page has failed, instead of the whole application going white: the splash
 * screen, its mark turned to a cross, saying why by what kind of failure it was, with a way to try
 * again — the same screen that says when the server cannot be reached.
 *
 * @param error - What the page threw, where the router has it.
 */
const PageProblem = ({ error }: PageProblemProps) => {
  const thrown = ThrownSchema.safeParse(error);
  const { headline, reason } = describeProblem(thrown.success ? thrown.data.message : null);

  return (
    <SplashScreenWithBrand
      label={headline}
      failure={{ title: headline, detail: reason }}
      onTryAgain={() => {
        window.location.reload();
      }}
      hasMark={true}
      marksPlace="valence-mark"
    />
  );
};

PageProblem.displayName = 'PageProblem';

export { PageProblem };
