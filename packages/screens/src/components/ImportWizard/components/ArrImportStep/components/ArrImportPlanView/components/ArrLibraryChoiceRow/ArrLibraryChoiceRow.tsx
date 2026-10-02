import { Badge } from '@ValenceUI/Badge';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import type { ArrLibraryChoice } from '@ValenceContracts/schemas/ArrImport';
import type { ArrLibraryChoiceRowProps } from './ArrLibraryChoiceRow.types';
import { say } from '@ValenceI18n/say';

/**
 * One library an app fills, and who fulfils its requests from now on: the app, which keeps doing
 * the downloading while it keeps running and is the default; Valence's own downloader, with the
 * clients, indexers and profile brought in, for when the app is to be switched off; or nothing
 * changed — each said in a sentence under the choice.
 *
 * @param library - The library, and the app that fills it.
 * @param choice - What is chosen.
 * @param isDisabled - Whether the choice is locked while the setup is brought in.
 * @param onChoose - Called with the choice made.
 */
const ArrLibraryChoiceRow = ({
  library,
  choice,
  isDisabled,
  onChoose,
}: ArrLibraryChoiceRowProps) => {
  const app = library.appName;
  const items: { id: ArrLibraryChoice; label: string }[] = [
    { id: 'handOff', label: say('screens.importWizard.arrImportStep.handToApp', { app }) },
    { id: 'takeOver', label: say('screens.importWizard.arrImportStep.valenceDownloads') },
    { id: 'leave', label: say('screens.importWizard.arrImportStep.leaveAsItIs') },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-text">{library.libraryName}</span>
        <span className="text-xs text-text-muted">
          {say('screens.importWizard.arrImportStep.filledByAppFrom', {
            app,
            folders: library.rootFolders.join(', '),
          })}
        </span>
        {library.isGuessed ? (
          <Badge size="sm" tone="warning">
            {say('screens.importWizard.arrImportStep.matchedByNameOnly')}
          </Badge>
        ) : null}
      </div>

      <SegmentedRow
        label={say('screens.importWizard.arrImportStep.whoFulfilsLibrary', {
          library: library.libraryName,
        })}
        size="xs"
        items={items}
        value={choice}
        onSelect={(id) => {
          if (!isDisabled) {
            onChoose(id === 'takeOver' || id === 'leave' ? id : 'handOff');
          }
        }}
      />

      <p className="text-xs text-text-muted">
        {choice === 'handOff'
          ? say('screens.importWizard.arrImportStep.handOffExplained', { app })
          : choice === 'takeOver'
            ? library.profileName === null
              ? say('screens.importWizard.arrImportStep.takeOverExplained', { app })
              : say('screens.importWizard.arrImportStep.takeOverWithProfileExplained', {
                  app,
                  profile: library.profileName,
                })
            : say('screens.importWizard.arrImportStep.leaveExplained')}
      </p>
    </div>
  );
};

ArrLibraryChoiceRow.displayName = 'ArrLibraryChoiceRow';

export { ArrLibraryChoiceRow };
