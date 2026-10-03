import { useCallback, useEffect, useState } from 'react';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { fetchImportLibraries } from '@ValenceClient/imports/fetchImportLibraries';
import { fetchImportStatus } from '@ValenceClient/imports/fetchImportStatus';
import type {
  MediaImportRun,
  MediaImportSource,
  MediaImportStatus,
  PathMapping,
} from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { ImportStep } from './components/ImportStep/ImportStep';
import { LibrariesStep } from './components/LibrariesStep/LibrariesStep';
import { PeopleStep } from './components/PeopleStep/PeopleStep';
import type { PeopleChoice } from './components/PeopleStep/PeopleStep.types';
import { PlanStep } from './components/PlanStep/PlanStep';
import { ArrImportStep } from './components/ArrImportStep/ArrImportStep';
import { SetupLinksStep } from './components/SetupLinksStep/SetupLinksStep';
import { SourceStep } from './components/SourceStep/SourceStep';
import type { ImportStepId, ImportWizardProps } from './ImportWizard.types';

const STEPS: readonly ImportStepId[] = [
  'source',
  'people',
  'libraries',
  'plan',
  'importing',
  'requests',
  'links',
];

/**
 * The heading of each step.
 *
 * @param step - The step.
 * @returns What it is called.
 */
const titleOf = (step: ImportStepId): string =>
  ({
    source: say('screens.importWizard.whereIsEverythingComingFrom'),
    people: say('screens.importWizard.whoComesAcross'),
    libraries: say('screens.importWizard.librariesFirst'),
    plan: say('screens.importWizard.whatWillComeAcross'),
    importing: say('screens.importWizard.importing'),
    requests: say('screens.importWizard.requestingToo'),
    links: say('screens.importWizard.handOutTheLinks'),
  })[step];

/**
 * Brings everything across from Jellyfin, Emby or Plex: the server and its key, who comes across,
 * the libraries made and scanned first, a dry run and its report, the import itself followed live,
 * the requesting apps beside it, and each new person's setup link.
 *
 * @param onFinished - Told when the administrator is done, where something should follow.
 */
const ImportWizard = ({ onFinished }: ImportWizardProps) => {
  const [status, setStatus] = useState<MediaImportStatus | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [step, setStep] = useState<ImportStepId>('source');
  const [source, setSource] = useState<MediaImportSource | null>(null);
  const [choice, setChoice] = useState<PeopleChoice>({ skipUserIds: [], meUserId: null });
  const [run, setRun] = useState<MediaImportRun | null>(null);
  const [mappings, setMappings] = useState<readonly PathMapping[]>([]);

  const read = useCallback(async () => {
    setProblem(null);

    const answer = await fetchImportStatus();

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setStatus(answer.value);
  }, []);

  useEffect(() => {
    void read();
  }, [read]);

  const finished = useCallback((done: MediaImportRun) => {
    setRun(done);
    setStep('requests');
  }, []);

  useEffect(() => {
    if (step !== 'requests' || source === null) {
      return;
    }

    void fetchImportLibraries(source.id).then((answer) => {
      if (answer.kind === 'answered') {
        setMappings(answer.value.mappings);
      }
    });
  }, [step, source]);

  if (problem !== null) {
    return (
      <CouldNotRead
        said={problem}
        onTryAgain={() => {
          void read();
        }}
      />
    );
  }

  if (status === null) {
    return (
      <Spinner isCentered size="sm" label={say('screens.importWizard.readingWhatIsConnected')} />
    );
  }

  const chooseSource = (chosen: MediaImportSource) => {
    const latest = status.runs.find((one) => one.sourceId === chosen.id);

    setSource(chosen);

    if (latest?.state === 'importing') {
      setRun(latest);
      setStep('importing');

      return;
    }

    setStep('people');
  };

  return (
    <section
      className="flex flex-col gap-6"
      aria-label={say('screens.adminArea.adminSections.import')}
    >
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">
          {say('common.stepNumberOfTotal', {
            number: (STEPS.indexOf(step) + 1).toString(),
            total: STEPS.length.toString(),
          })}
        </span>
        <h2 className="text-xl font-semibold text-text">{titleOf(step)}</h2>
      </header>

      {step === 'source' ? (
        <SourceStep
          sources={status.sources}
          onConnected={chooseSource}
          onForgotten={() => {
            void read();
          }}
        />
      ) : null}

      {step === 'people' && source !== null ? (
        <PeopleStep
          source={source}
          onBack={() => {
            setStep('source');
          }}
          onContinue={(chosen) => {
            setChoice(chosen);
            setStep('libraries');
          }}
        />
      ) : null}

      {step === 'libraries' && source !== null ? (
        <LibrariesStep
          source={source}
          onBack={() => {
            setStep('people');
          }}
          onContinue={() => {
            setStep('plan');
          }}
        />
      ) : null}

      {step === 'plan' && source !== null ? (
        <PlanStep
          source={source}
          choice={choice}
          onBack={() => {
            setStep('libraries');
          }}
          onStarted={(started) => {
            setRun(started);
            setStep('importing');
          }}
        />
      ) : null}

      {step === 'importing' && run !== null ? (
        <ImportStep started={run} onFinished={finished} />
      ) : null}

      {step === 'requests' ? (
        <ArrImportStep
          pathMappings={mappings}
          onDone={() => {
            setStep('links');
          }}
          onSkip={() => {
            setStep('links');
          }}
        />
      ) : null}

      {step === 'links' && run !== null ? (
        <SetupLinksStep
          run={run}
          onFinish={() => {
            setStep('source');
            setSource(null);
            setRun(null);
            void read();
            onFinished?.();
          }}
        />
      ) : null}
    </section>
  );
};

ImportWizard.displayName = 'ImportWizard';

export { ImportWizard };
