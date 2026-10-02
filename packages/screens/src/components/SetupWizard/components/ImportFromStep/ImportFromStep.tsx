import { useState } from 'react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import { ImportWizard } from '@ValenceScreens/components/ImportWizard/ImportWizard';
import { ArrImportStep } from '@ValenceScreens/components/ImportWizard/components/ArrImportStep/ArrImportStep';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import type { ImportedFrom } from '@ValenceScreens/components/SetupWizard/SetupWizard.types';
import type { ImportFromStepProps } from './ImportFromStep.types';

type Stage = 'choosing' | 'server' | 'requests';

/**
 * Whether anything comes across from another server, and if it does, the bringing across itself,
 * followed here rather than on a page of its own: Jellyfin, Emby or Plex through the whole import,
 * or only the requesting apps. Starting fresh is as good an answer as either.
 *
 * @param onBack - Told to go back a step.
 * @param onDone - Told what came across, once it has.
 */
const ImportFromStep = ({ onBack, onDone }: ImportFromStepProps) => {
  const [chosen, setChosen] = useState<ImportedFrom>('fresh');
  const [stage, setStage] = useState<Stage>('choosing');

  if (stage === 'server') {
    return (
      <SetupStepFrame
        isWide
        title={say('screens.setupWizard.importStep.fromJellyfinEmbyOrPlex')}
        lead={
          <span className="flex flex-col items-start gap-3">
            {say('screens.setupWizard.importStep.nothingOnTheOldServerChanges')}
            <span className="-ml-2.5 flex flex-wrap gap-1">
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setStage('choosing');
                }}
              >
                {say('screens.setupWizard.importStep.chooseAgain')}
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  onDone('fresh');
                }}
              >
                {say('screens.setupWizard.importStep.finishWithoutImporting')}
              </Button>
            </span>
          </span>
        }
      >
        <ImportWizard
          onFinished={() => {
            onDone('server');
          }}
        />
      </SetupStepFrame>
    );
  }

  if (stage === 'requests') {
    return (
      <SetupStepFrame
        isWide
        title={say('screens.setupWizard.importStep.yourRequestingApps')}
        lead={say('screens.setupWizard.importStep.radarrSonarrLidarrProwlarrAndSeerr')}
      >
        <ArrImportStep
          onDone={() => {
            onDone('requests');
          }}
          onSkip={() => {
            setStage('choosing');
          }}
        />
      </SetupStepFrame>
    );
  }

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.steps.importFromAnotherServer')}
      lead={say('screens.setupWizard.importStep.comingFromAnotherServer')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <Button
          variant="confirm"
          size="lg"
          onClick={() => {
            if (chosen === 'fresh') {
              onDone('fresh');

              return;
            }

            setStage(chosen);
          }}
        >
          {chosen === 'fresh'
            ? say('screens.setupWizard.importStep.startFresh')
            : say('common.continue')}
          <Icon of={ArrowRightIcon} size={16} />
        </Button>
      }
    >
      <ChoiceList
        look="tiles"
        label={say('screens.setupWizard.steps.importFromAnotherServer')}
        value={chosen}
        onChoose={(id) => {
          setChosen(id === 'server' || id === 'requests' ? id : 'fresh');
        }}
        choices={[
          {
            id: 'fresh',
            title: say('screens.setupWizard.importStep.startFresh'),
            detail: say('screens.setupWizard.importStep.nothingToImport'),
          },
          {
            id: 'server',
            title: say('screens.setupWizard.importStep.fromJellyfinEmbyOrPlex'),
            detail: say('screens.setupWizard.importStep.peopleWatchingAndLibraries'),
          },
          {
            id: 'requests',
            title: say('screens.setupWizard.importStep.onlyMyRequestingApps'),
            detail: say('screens.setupWizard.importStep.radarrSonarrLidarrProwlarrAndSeerr'),
          },
        ]}
      />
    </SetupStepFrame>
  );
};

ImportFromStep.displayName = 'ImportFromStep';

export { ImportFromStep };
