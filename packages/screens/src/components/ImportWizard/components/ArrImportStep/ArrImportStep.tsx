import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Link } from '@ValenceUI/Link';
import { Spinner } from '@ValenceUI/Spinner';
import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import type {
  ArrImportApplied,
  ArrImportPlan,
  ArrImportSourceKind,
  ArrLibraryChoice,
  ArrPathMapping,
  ArrWantedOutcome,
} from '@ValenceContracts/schemas/ArrImport';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { applyArrImport } from '@ValenceClient/requests/applyArrImport';
import { askForArrWanted } from '@ValenceClient/requests/askForArrWanted';
import { planArrImport } from '@ValenceClient/requests/planArrImport';
import { ArrImportOutcome } from './components/ArrImportOutcome/ArrImportOutcome';
import { ArrImportPlanView } from './components/ArrImportPlanView/ArrImportPlanView';
import { ArrPathMappingsForm } from './components/ArrPathMappingsForm/ArrPathMappingsForm';
import { ArrSourcesForm } from './components/ArrSourcesForm/ArrSourcesForm';
import { askOf } from './askOf';
import { wantedBatchesOf } from './wantedBatchesOf';
import type { ArrImportStepProps, ArrSourceRow } from './ArrImportStep.types';
import { say } from '@ValenceI18n/say';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

type Phase = 'editing' | 'planning' | 'applying' | 'asking' | 'done';

const STARTING_KINDS: readonly ArrImportSourceKind[] = [
  'overseerr',
  'radarr',
  'sonarr',
  'lidarr',
  'prowlarr',
];

const SWITCHING_ON = `${DOCS_ADDRESS}/install/requesting#switching-it-on`;

const ABOUT = `${DOCS_ADDRESS}/install/migrating-arr-setup`;

const NOTHING_ASKED: ArrWantedOutcome & { done: number } = {
  done: 0,
  made: 0,
  already: 0,
  failed: [],
};

/**
 * Brings a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup into Valence's
 * requesting, reading from them and never changing them: the admin gives each app's address and
 * key — or only Overseerr's or Jellyseerr's, which names the Radarr and Sonarr it uses and holds
 * their keys — and where the apps' folders are as Valence sees them; Valence says what it would
 * bring in, asks again for any password or key the apps show only masked, and lets the admin
 * choose for each library whether its requests go on to the app, as they do by default while it
 * keeps running, or to Valence's own downloader; then it brings it all in and asks for what was
 * being waited for, a batch at a time, showing how far it has got. Without the requests service it
 * says so, and how to switch it on.
 *
 * @param pathMappings - Where the apps' folders are as Valence sees them, to start from — such as
 * the mappings a Jellyfin, Emby or Plex import was given.
 * @param onDone - Called once everything is brought in and asked for.
 * @param onSkip - Called to go on without bringing anything in; no skip is offered without it.
 */
const ArrImportStep = ({ pathMappings = [], onDone, onSkip }: ArrImportStepProps) => {
  const cache = useQueryClient();
  const availability = useQuery(requestsQueries.availability());
  const nextId = useRef(STARTING_KINDS.length);
  const [rows, setRows] = useState<ArrSourceRow[]>(() =>
    STARTING_KINDS.map((kind, id) => ({ id, kind, url: '', apiKey: '' })),
  );
  const [mappings, setMappings] = useState<ArrPathMapping[]>(() => [...pathMappings]);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [choices, setChoices] = useState<Record<string, ArrLibraryChoice>>({});
  const [plan, setPlan] = useState<ArrImportPlan | null>(null);
  const [applied, setApplied] = useState<ArrImportApplied | null>(null);
  const [asked, setAsked] = useState(NOTHING_ASKED);
  const [phase, setPhase] = useState<Phase>('editing');
  const [problem, setProblem] = useState<string | null>(null);
  const isBusy = phase === 'planning' || phase === 'applying' || phase === 'asking';
  const isLocked = isBusy || phase === 'done';

  const readPlan = () => {
    const read = askOf(rows, mappings, secrets, choices);

    setProblem(read.problem);

    if (read.ask === null) {
      return;
    }

    setPhase('planning');

    void planArrImport(read.ask).then(({ value, refusal }) => {
      setPlan(value ?? plan);
      setProblem(refusal?.message ?? null);
      setPhase('editing');
    });
  };

  const bringIn = async () => {
    const read = askOf(rows, mappings, secrets, choices);

    setProblem(read.problem);

    if (read.ask === null) {
      return;
    }

    setPhase('applying');

    const { value, refusal } = await applyArrImport(read.ask);

    if (value === null) {
      setProblem(
        refusal?.message ?? say('screens.importWizard.arrImportStep.itCouldNotBeBroughtIn'),
      );
      setPhase('editing');

      return;
    }

    setApplied(value);
    setAsked(NOTHING_ASKED);
    setPhase('asking');

    let tally = NOTHING_ASKED;

    for (const batch of wantedBatchesOf(value.wanted)) {
      const outcome = await askForArrWanted(batch);

      tally = {
        done: tally.done + batch.length,
        made: tally.made + (outcome.value?.made ?? 0),
        already: tally.already + (outcome.value?.already ?? 0),
        failed: [
          ...tally.failed,
          ...(outcome.value?.failed ??
            batch.map((one) => ({
              key: one.key,
              title: one.title,
              problem: sayVerbatim(
                outcome.refusal?.message ??
                  say('screens.importWizard.arrImportStep.itCouldNotBeAskedFor'),
              ),
            }))),
        ],
      };
      setAsked(tally);
    }

    await Promise.all([
      cache.invalidateQueries({ queryKey: requestsQueries.arrApps().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.indexers().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.downloadClients().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.profiles().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.mediaRequests().queryKey }),
      cache.invalidateQueries({ queryKey: libraryQueries.all().queryKey }),
    ]);
    setPhase('done');
  };

  if (availability.isPending) {
    return (
      <Spinner size="sm" label={say('screens.importWizard.arrImportStep.checkingRequesting')} />
    );
  }

  if (availability.data?.isEnabled !== true) {
    return (
      <div className="flex flex-col gap-4">
        <Callout title={say('screens.importWizard.arrImportStep.requestingIsNotSwitchedOn')}>
          <p>{say('screens.importWizard.arrImportStep.switchOnTheRequestsProfile')}</p>
          <Link href={SWITCHING_ON}>
            {say('screens.importWizard.arrImportStep.howToSwitchRequestingOn')}
          </Link>
        </Callout>
        {onSkip === undefined ? null : (
          <Button variant="secondary" className="self-start" onClick={onSkip}>
            {say('screens.importWizard.arrImportStep.skipThis')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-muted">
        {say('screens.importWizard.arrImportStep.valenceOnlyReadsFromTheseApps')}{' '}
        <Link href={ABOUT}>{say('screens.importWizard.arrImportStep.whatIsBroughtAcross')}</Link>
      </p>

      <HeadedSection title={say('screens.importWizard.arrImportStep.yourApps')}>
        <p className="mb-3 text-sm text-text-muted">
          {say('screens.importWizard.arrImportStep.overseerrFindsTheRest')}
        </p>
        <ArrSourcesForm
          rows={rows}
          isDisabled={isLocked}
          onChange={(id, change) => {
            setRows((current) =>
              current.map((row) => (row.id === id ? { ...row, ...change } : row)),
            );
          }}
          onAdd={(kind) => {
            const id = nextId.current;

            nextId.current += 1;
            setRows((current) => [...current, { id, kind, url: '', apiKey: '' }]);
          }}
          onRemove={(id) => {
            setRows((current) => current.filter((row) => row.id !== id));
          }}
        />
      </HeadedSection>

      <HeadedSection title={say('screens.importWizard.arrImportStep.whereTheirFoldersAre')}>
        <p className="mb-3 text-sm text-text-muted">
          {say('screens.importWizard.arrImportStep.mapFoldersExplained')}
        </p>
        <ArrPathMappingsForm mappings={mappings} isDisabled={isLocked} onChange={setMappings} />
      </HeadedSection>

      {plan === null ? null : (
        <ArrImportPlanView
          plan={plan}
          secrets={secrets}
          choices={choices}
          isDisabled={isLocked}
          onSecretChange={(key, value) => {
            setSecrets((current) => ({ ...current, [key]: value }));
          }}
          onChoose={(libraryId, choice) => {
            setChoices((current) => ({ ...current, [libraryId]: choice }));
          }}
        />
      )}

      {applied === null ? null : (
        <ArrImportOutcome applied={applied} asked={asked} isAsking={phase === 'asking'} />
      )}

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {phase === 'done' ? (
          <Button
            variant="confirm"
            size="lg"
            onClick={() => {
              if (applied !== null) {
                onDone?.(applied);
              }
            }}
          >
            {say('common.done')}
          </Button>
        ) : (
          <>
            {onSkip === undefined ? null : (
              <Button variant="ghost" disabled={isBusy} onClick={onSkip}>
                {say('screens.importWizard.arrImportStep.skipThis')}
              </Button>
            )}
            <Button
              variant={plan === null ? 'confirm' : 'secondary'}
              size={plan === null ? 'lg' : 'md'}
              isLoading={phase === 'planning'}
              disabled={isBusy}
              onClick={readPlan}
            >
              {plan === null
                ? say('screens.importWizard.arrImportStep.readTheSetup')
                : say('screens.importWizard.arrImportStep.readItAgain')}
            </Button>
            {plan === null ? null : (
              <Button
                variant="confirm"
                size="lg"
                isLoading={phase === 'applying' || phase === 'asking'}
                disabled={isBusy}
                onClick={() => {
                  void bringIn();
                }}
              >
                {say('screens.importWizard.arrImportStep.bringItIn')}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

ArrImportStep.displayName = 'ArrImportStep';

export { ArrImportStep };
