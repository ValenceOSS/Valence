import { Callout } from '@ValenceUI/Callout';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import type { ArrImportOutcomeProps } from './ArrImportOutcome.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * How bringing a setup in went: what was added and what Valence had already, how far asking for
 * what was being waited for has got, and what could not be done and why.
 *
 * @param applied - What bringing it in did.
 * @param asked - How many of what was waited for have been asked for so far, and how.
 * @param isAsking - Whether they are still being asked for.
 */
const ArrImportOutcome = ({ applied, asked, isAsking }: ArrImportOutcomeProps) => {
  const total = applied.wanted.length;
  const problems = [
    ...applied.problems.map(sayAgain),
    ...asked.failed.map((one) =>
      say('screens.importWizard.arrImportStep.titleProblem', {
        title: one.title === '' ? one.key : one.title,
        problem: sayAgain(one.problem),
      }),
    ),
  ];

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1 text-sm text-text">
        <li>
          {say('screens.importWizard.arrImportStep.clientsAddedKept', {
            added: applied.clients.added.toString(),
            kept: applied.clients.kept.toString(),
          })}
        </li>
        <li>
          {say('screens.importWizard.arrImportStep.indexersAddedKept', {
            added: (applied.indexers.added + (applied.prowlarr?.added ?? 0)).toString(),
            kept: (
              applied.indexers.kept +
              (applied.prowlarr?.unchanged ?? 0) +
              (applied.prowlarr?.updated ?? 0)
            ).toString(),
          })}
        </li>
        <li>
          {say('screens.importWizard.arrImportStep.profilesAddedKept', {
            added: applied.profiles.added.toString(),
            kept: applied.profiles.kept.toString(),
          })}
        </li>
        <li>
          {say('screens.importWizard.arrImportStep.appsConnectedKept', {
            added: applied.apps.added.toString(),
            kept: applied.apps.kept.toString(),
          })}
        </li>
      </ul>

      {total === 0 ? null : (
        <ProgressBar
          label={say('screens.importWizard.arrImportStep.askingForWhatWasWaitedFor')}
          value={asked.done}
          max={total}
          readout={say('common.doneOfTotal', {
            done: asked.done.toString(),
            total: total.toString(),
          })}
        />
      )}

      {isAsking || total === 0 ? null : (
        <p className="text-sm text-text">
          {sayCount('screens.importWizard.arrImportStep.requestsMadeAlready', asked.made, {
            already: asked.already.toString(),
          })}
        </p>
      )}

      {problems.length === 0 ? null : (
        <Callout
          tone="warning"
          title={say('screens.importWizard.arrImportStep.someThingsCouldNotBeDone')}
        >
          <ul className="flex flex-col gap-0.5">
            {problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
};

ArrImportOutcome.displayName = 'ArrImportOutcome';

export { ArrImportOutcome };
