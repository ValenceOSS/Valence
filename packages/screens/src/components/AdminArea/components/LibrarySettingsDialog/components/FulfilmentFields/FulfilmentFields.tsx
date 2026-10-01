import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { ARR_APP_NAMES } from '@ValenceScreens/components/AdminArea/ARR_APP_NAMES';
import { VALENCE } from '@ValenceScreens/components/AdminArea/components/LibrarySettingsDialog/readFulfilmentForm';
import { FieldMenu } from './components/FieldMenu/FieldMenu';
import type { FulfilmentFieldsProps } from './FulfilmentFields.types';
import { say } from '@ValenceI18n/say';

/**
 * Who fulfils a library's requests: Valence itself, searching and downloading as it always has, or
 * a connected Radarr, Sonarr or Lidarr of the kind the library holds, which is then handed each
 * request whole — with the root folder, quality profile and, for Lidarr, metadata profile it uses
 * there, and whether it searches as soon as something is added.
 *
 * @param kind - The kind of app the library's requests can go to.
 * @param apps - Every connected app.
 * @param form - What is chosen.
 * @param onChange - Called with what changed.
 */
const FulfilmentFields = ({ kind, apps, form, onChange }: FulfilmentFieldsProps) => {
  const fitting = apps.filter((app) => app.kind === kind);
  const isHandedOff = form.appId !== VALENCE;
  const choices = useQuery(requestsQueries.arrAppChoices(isHandedOff ? form.appId : null));
  const nothingChosen = say('screens.adminArea.librarySettingsDialog.chooseOne');

  return (
    <div className="flex flex-col gap-3">
      <FieldMenu
        label={say('screens.adminArea.librarySettingsDialog.whoFulfilsRequests')}
        selectedId={form.appId}
        placeholder={nothingChosen}
        onSelect={(appId) => {
          onChange({
            appId,
            rootFolderPath: '',
            qualityProfileId: '',
            metadataProfileId: '',
          });
        }}
        options={[
          {
            id: VALENCE,
            label: say('common.valence'),
            detail: say(
              'screens.adminArea.librarySettingsDialog.valenceSearchesDownloadsAndFilesIt',
            ),
          },
          ...fitting.map((app) => ({
            id: app.id,
            label: app.name,
            detail: say('screens.adminArea.librarySettingsDialog.kindSearchesDownloadsAndImports', {
              kind: ARR_APP_NAMES[app.kind],
            }),
          })),
        ]}
      />

      {!isHandedOff ? null : choices.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.librarySettingsDialog.theAppsFoldersAndProfilesCould')}
          isTryingAgain={choices.isFetching}
          onTryAgain={() => {
            void choices.refetch();
          }}
        />
      ) : choices.isPending ? (
        <Spinner
          label={say('screens.adminArea.librarySettingsDialog.readingTheAppsFoldersAndProfiles')}
          size="sm"
        />
      ) : (
        <>
          <FieldMenu
            label={say('screens.adminArea.librarySettingsDialog.rootFolder')}
            selectedId={form.rootFolderPath}
            placeholder={nothingChosen}
            onSelect={(rootFolderPath) => {
              onChange({ rootFolderPath });
            }}
            options={choices.data.rootFolders.map((folder) => ({
              id: folder.path,
              label: folder.path,
              ...(folder.isAccessible
                ? {}
                : {
                    detail: say(
                      'screens.adminArea.librarySettingsDialog.theAppCannotReachThisFolder',
                    ),
                  }),
            }))}
          />

          <FieldMenu
            label={say('screens.adminArea.librarySettingsDialog.qualityProfileInTheApp')}
            selectedId={form.qualityProfileId}
            placeholder={nothingChosen}
            onSelect={(qualityProfileId) => {
              onChange({ qualityProfileId });
            }}
            options={choices.data.qualityProfiles.map((profile) => ({
              id: profile.id.toString(),
              label: profile.name,
            }))}
          />

          {kind === 'lidarr' ? (
            <FieldMenu
              label={say('screens.adminArea.librarySettingsDialog.metadataProfile')}
              selectedId={form.metadataProfileId}
              placeholder={nothingChosen}
              onSelect={(metadataProfileId) => {
                onChange({ metadataProfileId });
              }}
              options={choices.data.metadataProfiles.map((profile) => ({
                id: profile.id.toString(),
                label: profile.name,
              }))}
            />
          ) : null}

          <Switch
            label={say('screens.adminArea.librarySettingsDialog.searchAsSoonAsItIsAdded')}
            isOn={form.searchesOnAdd}
            onToggle={() => {
              onChange({ searchesOnAdd: !form.searchesOnAdd });
            }}
          />
        </>
      )}
    </div>
  );
};

FulfilmentFields.displayName = 'FulfilmentFields';

export { FulfilmentFields };
