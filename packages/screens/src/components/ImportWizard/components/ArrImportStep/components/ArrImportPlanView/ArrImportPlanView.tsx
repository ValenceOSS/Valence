import { Badge } from '@ValenceUI/Badge';
import { Callout } from '@ValenceUI/Callout';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { TextField } from '@ValenceUI/TextField';
import { ARR_IMPORT_SOURCE_NAMES } from '@ValenceContracts/constants/ARR_IMPORT_SOURCE_NAMES';
import type { ArrImportStanding } from '@ValenceContracts/schemas/ArrImport';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { Said } from '@ValenceI18n/SaidSchema';
import { ArrLibraryChoiceRow } from './components/ArrLibraryChoiceRow/ArrLibraryChoiceRow';
import type { ArrImportPlanViewProps } from './ArrImportPlanView.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayCount } from '@ValenceI18n/sayCount';

const STANDINGS: Readonly<Record<ArrImportStanding, { label: string; tone: BadgeTone }>> = {
  new: { label: say('screens.importWizard.arrImportStep.willBeAdded'), tone: 'accent' },
  kept: { label: say('screens.importWizard.arrImportStep.alreadyInValence'), tone: 'quiet' },
  unsupported: {
    label: say('screens.importWizard.arrImportStep.notBroughtAcross'),
    tone: 'warning',
  },
};

/**
 * One thing a plan would bring in: its name, whether it is new, where it is, which apps it is
 * from, and what was said of it.
 *
 * @param key - What tells it apart from the others in its list.
 * @param name - What it is called.
 * @param standing - Whether it is new, kept or not brought across.
 * @param detail - Where it is, if anywhere.
 * @param from - The apps it is from.
 * @param notes - What was said of it.
 * @returns The line.
 */
const lineOf = (
  key: string,
  name: string,
  standing: ArrImportStanding,
  detail: string | null,
  from: readonly string[],
  notes: readonly Said[],
) => (
  <li key={key} className="flex flex-col gap-0.5 py-1.5">
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-text">{name}</span>
      <Badge size="sm" tone={STANDINGS[standing].tone}>
        {STANDINGS[standing].label}
      </Badge>
    </span>
    <span className="text-xs text-text-muted">
      {detail === null
        ? say('screens.importWizard.arrImportStep.fromApps', { apps: from.join(', ') })
        : say('screens.importWizard.arrImportStep.detailFromApps', {
            detail,
            apps: from.join(', '),
          })}
    </span>
    {notes.map((note, index) => (
      <span key={index} className="text-xs text-text-muted">
        {sayAgain(note)}
      </span>
    ))}
  </li>
);

/**
 * What bringing a setup in would do, before anything is done: each app read and its version or why
 * it could not be read, the download clients, indexers and quality profiles and whether each is new,
 * already in Valence or cannot be brought across and why, the libraries the apps fill with who is to
 * fulfil each, folders no library holds, how much was being waited for, and a field for each
 * password or key the apps show only masked.
 *
 * @param plan - The plan.
 * @param secrets - Masked secrets typed in so far.
 * @param choices - How each library is to be fulfilled, where changed from handing it off.
 * @param isDisabled - Whether everything is locked while the setup is brought in.
 * @param onSecretChange - Called with a secret as typed.
 * @param onChoose - Called with a library's choice.
 */
const ArrImportPlanView = ({
  plan,
  secrets,
  choices,
  isDisabled,
  onSecretChange,
  onChoose,
}: ArrImportPlanViewProps) => {
  const nothing = (
    <p className="text-sm text-text-muted">
      {say('screens.importWizard.arrImportStep.nothingHere')}
    </p>
  );

  return (
    <div className="flex flex-col gap-5">
      <HeadedSection title={say('screens.importWizard.arrImportStep.appsRead')}>
        <ul className="flex flex-col divide-y divide-border">
          {plan.sources.map((source) => (
            <li key={`${source.kind}:${source.url}`} className="flex flex-col gap-0.5 py-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-text">{source.name}</span>
                <Badge size="sm">{ARR_IMPORT_SOURCE_NAMES[source.kind]}</Badge>
                {source.version === null ? null : (
                  <span className="text-xs text-text-muted">{source.version}</span>
                )}
              </span>
              <span className="text-xs text-text-muted">
                {source.foundThrough === null
                  ? source.url
                  : say('screens.importWizard.arrImportStep.urlFoundThrough', {
                      url: source.url,
                      through: source.foundThrough,
                    })}
              </span>
              {source.problem === null ? null : (
                <span role="alert" className="text-xs text-danger">
                  {sayAgain(source.problem)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </HeadedSection>

      {plan.secrets.length === 0 ? null : (
        <HeadedSection title={say('screens.importWizard.arrImportStep.passwordsAndKeys')}>
          <p className="mb-3 text-sm text-text-muted">
            {say('screens.importWizard.arrImportStep.theseAppsShowSecretsMasked')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.secrets.map((secret) => (
              <TextField
                key={secret.key}
                type="password"
                size="sm"
                autoComplete="new-password"
                label={
                  secret.field === 'password'
                    ? say('screens.importWizard.arrImportStep.passwordForItem', {
                        item: secret.item,
                      })
                    : say('screens.importWizard.arrImportStep.apiKeyForItem', { item: secret.item })
                }
                description={say('screens.importWizard.arrImportStep.fromApps', {
                  apps: secret.from.join(', '),
                })}
                value={secrets[secret.key] ?? ''}
                disabled={isDisabled}
                onValueChange={(value) => {
                  onSecretChange(secret.key, value);
                }}
              />
            ))}
          </div>
        </HeadedSection>
      )}

      <HeadedSection title={say('common.libraries')}>
        <div className="flex flex-col gap-3">
          {plan.libraries.length === 0 ? nothing : null}
          {plan.libraries.map((library) => (
            <ArrLibraryChoiceRow
              key={library.libraryId}
              library={library}
              choice={choices[library.libraryId] ?? 'handOff'}
              isDisabled={isDisabled}
              onChoose={(choice) => {
                onChoose(library.libraryId, choice);
              }}
            />
          ))}
          {plan.unplacedFolders.length === 0 ? null : (
            <Callout
              tone="warning"
              title={say('screens.importWizard.arrImportStep.noLibraryHoldsTheseFolders')}
            >
              <ul className="flex flex-col gap-0.5">
                {plan.unplacedFolders.map((folder) => (
                  <li key={`${folder.from}:${folder.path}`}>
                    {say('screens.importWizard.arrImportStep.pathFromApp', {
                      path: folder.path,
                      app: folder.from,
                    })}
                  </li>
                ))}
              </ul>
            </Callout>
          )}
        </div>
      </HeadedSection>

      <HeadedSection title={say('screens.downloadsPanel.downloadClientsTable.downloadClients')}>
        {plan.clients.length === 0 ? (
          nothing
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {plan.clients.map((client) =>
              lineOf(
                client.key,
                client.name,
                client.standing,
                client.url,
                client.from,
                client.notes,
              ),
            )}
          </ul>
        )}
      </HeadedSection>

      <HeadedSection title={say('common.indexers')}>
        {plan.prowlarr === null ? null : (
          <ul className="flex flex-col">
            {lineOf(
              plan.prowlarr.url,
              sayCount(
                'screens.importWizard.arrImportStep.indexersThroughProwlarr',
                plan.prowlarr.indexerCount,
                {
                  name: plan.prowlarr.name,
                },
              ),
              plan.prowlarr.standing,
              plan.prowlarr.url,
              [plan.prowlarr.name],
              [],
            )}
          </ul>
        )}
        {plan.indexers.length === 0 && plan.prowlarr === null ? nothing : null}
        <ul className="flex flex-col divide-y divide-border">
          {plan.indexers.map((indexer) =>
            lineOf(
              indexer.key,
              indexer.name,
              indexer.standing,
              indexer.url,
              indexer.from,
              indexer.notes,
            ),
          )}
        </ul>
      </HeadedSection>

      <HeadedSection title={say('screens.importWizard.arrImportStep.qualityProfiles')}>
        {plan.profiles.length === 0 ? (
          nothing
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {plan.profiles.map((profile) =>
              lineOf(
                profile.key,
                profile.name,
                profile.standing,
                null,
                [profile.from],
                profile.notes,
              ),
            )}
          </ul>
        )}
      </HeadedSection>

      <HeadedSection title={say('screens.importWizard.arrImportStep.whatWasBeingWaitedFor')}>
        <ul className="flex flex-col gap-1 text-sm text-text">
          <li>
            {sayCount('screens.importWizard.arrImportStep.monitoredFilms', plan.wanted.films)}
          </li>
          <li>
            {sayCount('screens.importWizard.arrImportStep.monitoredSeries', plan.wanted.series)}
          </li>
          <li>
            {sayCount('screens.importWizard.arrImportStep.monitoredArtists', plan.wanted.artists)}
          </li>
          <li>
            {sayCount('screens.importWizard.arrImportStep.waitingRequests', plan.wanted.requests)}
          </li>
          {plan.wanted.unaskable === 0 ? null : (
            <li className="text-text-muted">
              {sayCount('screens.importWizard.arrImportStep.titlesWithNoId', plan.wanted.unaskable)}
            </li>
          )}
        </ul>
      </HeadedSection>
    </div>
  );
};

ArrImportPlanView.displayName = 'ArrImportPlanView';

export { ArrImportPlanView };
