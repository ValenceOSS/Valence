import { z } from 'zod';
import { Button } from '@ValenceUI/Button';
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
    <main
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-start gap-3 px-5 py-16 sm:px-10"
    >
      <h1 className="text-2xl font-semibold text-text">{headline}</h1>

      <p className="text-text-muted">{reason}</p>

      {said === null || said === '' ? null : (
        <pre className="max-w-full whitespace-pre-wrap break-words rounded-md bg-[var(--surface-hover)] p-3 font-mono text-xs text-text-muted">
          {said}
        </pre>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="confirm"
          onClick={() => {
            window.location.reload();
          }}
        >
          {say('common.tryAgain')}
        </Button>

        <Button
          variant="glossy"
          onClick={() => {
            window.location.assign('/');
          }}
        >
          {say('screens.pageProblem.goToStart')}
        </Button>
      </div>
    </main>
  );
};

PageProblem.displayName = 'PageProblem';

export { PageProblem };
