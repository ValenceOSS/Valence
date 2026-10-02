import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Spinner } from '@ValenceUI/Spinner';
import { cancelMediaImport } from '@ValenceClient/imports/cancelMediaImport';
import { planMediaImport } from '@ValenceClient/imports/planMediaImport';
import { startMediaImport } from '@ValenceClient/imports/startMediaImport';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { ImportReportView } from '@ValenceScreens/components/ImportWizard/components/ImportReportView/ImportReportView';
import { RunProgress } from '@ValenceScreens/components/ImportWizard/components/RunProgress/RunProgress';
import { useImportRun } from '@ValenceScreens/components/ImportWizard/useImportRun';
import type { PlanStepProps } from './PlanStep.types';

/**
 * The dry run: everything on the old server read and matched without anything written, followed
 * live, then the report of what would come across, to plan again or to bring it all across.
 *
 * @param source - The server being brought across.
 * @param choice - Who to leave out and which of them is the administrator.
 * @param onStarted - Told the import once it has started.
 * @param onBack - Told to go back a step.
 */
const PlanStep = ({ source, choice, onStarted, onBack }: PlanStepProps) => {
  const [started, setStarted] = useState<MediaImportRun | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const run = useImportRun(started);

  const plan = useCallback(async () => {
    setProblem(null);
    setStarted(null);

    const answer = await planMediaImport(source.id, choice);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setStarted(answer.value);
  }, [source.id, choice]);

  useEffect(() => {
    void plan();
  }, [plan]);

  const bringAcross = async (planned: MediaImportRun) => {
    setIsStarting(true);

    const answer = await startMediaImport(planned.id);

    setIsStarting(false);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    onStarted(answer.value);
  };

  const back = (
    <Button variant="ghost" className="-ml-3" onClick={onBack}>
      {say('common.back')}
    </Button>
  );

  if (problem !== null) {
    return (
      <div className="flex flex-col gap-4">
        <Callout tone="danger" title={problem} />
        <div className="flex items-center justify-between gap-3">
          {back}
          <Button
            variant="secondary"
            onClick={() => {
              void plan();
            }}
          >
            {say('screens.importWizard.planStep.planAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (run === null) {
    return (
      <Spinner
        isCentered
        size="sm"
        label={say('screens.importWizard.planStep.startingTheDryRun')}
      />
    );
  }

  if (run.state === 'planning') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          {say('screens.importWizard.planStep.readingEverythingWritingNothing', {
            source: source.name,
          })}
        </p>
        <RunProgress
          run={run}
          onCancel={() => {
            void cancelMediaImport(run.id).then((answer) => {
              if (answer.kind === 'answered') {
                setStarted(answer.value);
              }
            });
          }}
        />
      </div>
    );
  }

  if (run.state === 'failed' || run.state === 'cancelled' || run.report === null) {
    return (
      <div className="flex flex-col gap-4">
        <Callout
          tone={run.state === 'failed' ? 'danger' : 'quiet'}
          title={
            run.failure === null
              ? say('screens.importWizard.planStep.theDryRunStopped')
              : sayAgain(run.failure)
          }
        />
        <div className="flex items-center justify-between gap-3">
          {back}
          <Button
            variant="secondary"
            onClick={() => {
              void plan();
            }}
          >
            {say('screens.importWizard.planStep.planAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-muted">
        {say('screens.importWizard.planStep.nothingHasBeenWrittenYet')}
      </p>

      <ImportReportView report={run.report} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}

        <span className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void plan();
            }}
          >
            {say('screens.importWizard.planStep.planAgain')}
          </Button>

          <Button
            variant="confirm"
            size="lg"
            isLoading={isStarting}
            onClick={() => {
              void bringAcross(run);
            }}
          >
            {say('screens.importWizard.planStep.importEverything')}
          </Button>
        </span>
      </div>
    </div>
  );
};

PlanStep.displayName = 'PlanStep';

export { PlanStep };
