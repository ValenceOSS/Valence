import { useEffect } from 'react';
import { z } from 'zod';
import { reloadOnceForNewCode } from '@ValenceUI/reloadOnceForNewCode';
import { SplashScreenWithBrand } from '@ValenceScreens/components/SplashScreenWithBrand/SplashScreenWithBrand';
import { describeProblem } from './describeProblem';
import { isNewCodeProblem } from './isNewCodeProblem';
import type { PageProblemProps } from './PageProblem.types';

const ThrownSchema = z.object({ message: z.string() });

/**
 * What is shown where a page has failed, instead of the whole application going white: the splash
 * screen, its mark turned to a cross, saying why by what kind of failure it was, with a way to try
 * again — the same screen that says when the server cannot be reached. Where the page failed only
 * because the code it asked for has gone, it reloads by itself once, so a page opened across a new
 * release comes back on the new code rather than stopping.
 *
 * @param error - What the page threw, where the router has it.
 */
const PageProblem = ({ error }: PageProblemProps) => {
  const thrown = ThrownSchema.safeParse(error);
  const message = thrown.success ? thrown.data.message : null;
  const { headline, reason } = describeProblem(message);
  const isNewCode = isNewCodeProblem(message);

  useEffect(() => {
    if (isNewCode) {
      reloadOnceForNewCode(window);
    }
  }, [isNewCode]);

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
