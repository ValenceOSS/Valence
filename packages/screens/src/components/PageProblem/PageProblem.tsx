import { z } from 'zod';
import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { ProblemCard } from '@ValenceScreens/components/ProblemCard/ProblemCard';
import { describeProblem } from './describeProblem';
import type { PageProblemProps } from './PageProblem.types';
import { say } from '@ValenceI18n/say';

const ThrownSchema = z.object({ message: z.string() });

/**
 * What is shown where one page has failed, instead of the whole application going white.
 *
 * Each route draws its own, so a page that throws takes only itself down: the dock, the dialogs and
 * anything playing carry on, and the way out is to go somewhere else rather than to reload. It says
 * why, by what kind of failure it was, and shows what the failure itself said for anybody who has to
 * report it.
 *
 * @param error - What the page threw, where the router has it.
 */
const PageProblem = ({ error }: PageProblemProps) => {
  const thrown = ThrownSchema.safeParse(error);
  const said = thrown.success ? thrown.data.message : null;
  const { headline, reason } = describeProblem(said);

  return (
    <ProblemCard
      icon={TriangleAlertIcon}
      headline={headline}
      reason={reason}
      said={said}
      actions={
        <>
          <Button
            variant="glossy"
            onClick={() => {
              window.location.assign('/');
            }}
          >
            {say('screens.pageProblem.goToTheStart')}
          </Button>

          <Button
            variant="confirm"
            onClick={() => {
              window.location.reload();
            }}
          >
            {say('common.tryAgain')}
          </Button>
        </>
      }
    />
  );
};

PageProblem.displayName = 'PageProblem';

export { PageProblem };
