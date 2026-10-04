import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { cancelMediaImport } from '@ValenceClient/imports/cancelMediaImport';
import { startMediaImport } from '@ValenceClient/imports/startMediaImport';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { RunProgress } from '@ValenceScreens/components/ImportWizard/components/RunProgress/RunProgress';
import { useImportRun } from '@ValenceScreens/components/ImportWizard/useImportRun';
import type { ImportStepProps } from './ImportStep.types';

/**
 * The import itself, followed live until it is done, with a way to stop it and to carry on after a
 * stop or a failure, which picks up rather than repeats.
 *
 * @param started - The import as it started.
 * @param onFinished - Told the import once it has finished.
 */
const ImportStep = ({ started, onFinished }: ImportStepProps) => {
  const [current, setCurrent] = useState<MediaImportRun>(started);
  const run = useImportRun(current) ?? current;

  useEffect(() => {
    if (run.state === 'completed') {
      onFinished(run);
    }
  }, [run, onFinished]);

  if (run.state === 'importing' || run.state === 'planning') {
    return (
      <RunProgress
        run={run}
        onCancel={() => {
          void cancelMediaImport(run.id).then((answer) => {
            if (answer.kind === 'answered') {
              setCurrent(answer.value);
            }
          });
        }}
      />
    );
  }

  if (run.state === 'completed') {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Callout
        tone={run.state === 'failed' ? 'danger' : 'quiet'}
        title={
          run.failure === null
            ? say('screens.importWizard.importStep.theImportStopped')
            : sayAgain(run.failure)
        }
      >
        {say('screens.importWizard.importStep.carryingOnPicksUpWhereItStopped')}
      </Callout>

      <div className="flex justify-end">
        <Button
          variant="confirm"
          size="lg"
          onClick={() => {
            void startMediaImport(run.id).then((answer) => {
              if (answer.kind === 'answered') {
                setCurrent(answer.value);
              }
            });
          }}
        >
          {say('common.resume')}
        </Button>
      </div>
    </div>
  );
};

ImportStep.displayName = 'ImportStep';

export { ImportStep };
