import { Button } from '@ValenceUI/Button';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import type { RunProgressProps } from './RunProgress.types';

/**
 * How far an import's dry run or the import itself has got: the phase it is in, a bar for how much
 * of that phase is done, and a way to stop it.
 *
 * @param run - The import.
 * @param onCancel - Told when somebody stops it.
 */
const RunProgress = ({ run, onCancel }: RunProgressProps) => {
  const progress = run.progress;
  const phase =
    progress === null ? say('screens.mediaDetailDialog.preparing') : sayAgain(progress.phase);
  const fraction =
    progress === null || progress.total === 0
      ? null
      : Math.min(progress.processed / progress.total, 1);

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar
        label={phase}
        value={fraction === null ? null : Math.round(fraction * 100)}
        max={100}
        readout={
          progress === null || progress.total === 0
            ? null
            : say('screens.importWizard.runProgress.processedOfTotal', {
                processed: progress.processed.toString(),
                total: progress.total.toString(),
              })
        }
      />

      <div>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {say('common.stop')}
        </Button>
      </div>
    </div>
  );
};

RunProgress.displayName = 'RunProgress';

export { RunProgress };
