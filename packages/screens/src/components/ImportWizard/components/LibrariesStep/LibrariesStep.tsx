import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Spinner } from '@ValenceUI/Spinner';
import { createImportLibraries } from '@ValenceClient/imports/createImportLibraries';
import { fetchImportLibraries } from '@ValenceClient/imports/fetchImportLibraries';
import { linkImportLibrary } from '@ValenceClient/imports/linkImportLibrary';
import { fetchLibraries } from '@ValenceClient/library/fetchLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import { saveImportMappings } from '@ValenceClient/imports/saveImportMappings';
import type {
  CreatedImportLibrary,
  MediaImportLibraries,
  PathMapping,
} from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { PathMappings } from './components/PathMappings/PathMappings';
import { ScanFollower } from '@ValenceScreens/components/ScanFollower/ScanFollower';
import { libraryNameFor } from './libraryNameFor';
import type { LibrariesStepProps } from './LibrariesStep.types';

/**
 * The key a folder of a library on the old server is chosen by.
 *
 * @param sourceLibraryId - The library.
 * @param sourcePath - The folder.
 * @returns The key.
 */
const keyOf = (sourceLibraryId: string, sourcePath: string): string =>
  `${sourceLibraryId}|${sourcePath}`;

const NEW_LIBRARY = 'new';

const LEFT_OUT = 'skip';

/**
 * Libraries first: where each of the old server's folders is as Valence sees it, and which Valence
 * library each one comes into — one Valence already has, or one made and scanned for it, followed
 * live — so the media is there before anybody's watching is matched to it.
 *
 * @param source - The server being brought across.
 * @param onContinue - Told to go on to the dry run.
 * @param onBack - Told to go back a step.
 */
const LibrariesStep = ({ source, onContinue, onBack }: LibrariesStepProps) => {
  const [read, setRead] = useState<MediaImportLibraries | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [unwanted, setUnwanted] = useState<ReadonlySet<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isMaking, setIsMaking] = useState(false);
  const [made, setMade] = useState<{ created: CreatedImportLibrary; name: string }[]>([]);
  const [scanning, setScanning] = useState<ReadonlySet<string>>(new Set());
  const [ours, setOurs] = useState<readonly Library[]>([]);

  const load = useCallback(async () => {
    setProblem(null);

    const answer = await fetchImportLibraries(source.id);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setRead(answer.value);
    setOurs(await fetchLibraries().catch(() => []));
  }, [source.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const settled = useCallback((jobId: string) => {
    setScanning((held) => {
      if (!held.has(jobId)) {
        return held;
      }

      const next = new Set(held);

      next.delete(jobId);

      return next;
    });
  }, []);

  if (problem !== null) {
    return (
      <CouldNotRead
        said={problem}
        onTryAgain={() => {
          void load();
        }}
      />
    );
  }

  if (read === null) {
    return (
      <Spinner
        isCentered
        size="sm"
        label={say('screens.importWizard.librariesStep.readingTheLibraries')}
      />
    );
  }

  const save = async (mappings: PathMapping[]) => {
    setIsSaving(true);

    const answer = await saveImportMappings(source.id, mappings);

    setIsSaving(false);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setRead(answer.value);
  };

  const link = async (sourceLibraryId: string, sourcePath: string, libraryId: string) => {
    const answer = await linkImportLibrary(source.id, { sourceLibraryId, sourcePath, libraryId });

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setRead(answer.value);
  };

  const wanted = read.libraries.flatMap((library) => {
    const { kind } = library;

    return kind === null
      ? []
      : library.locations.flatMap((location, index) =>
          location.libraryId !== null ||
          unwanted.has(keyOf(library.sourceLibraryId, location.sourcePath))
            ? []
            : [
                {
                  sourceLibraryId: library.sourceLibraryId,
                  sourcePath: location.sourcePath,
                  name: libraryNameFor(library.name, index, library.locations.length),
                  kind,
                },
              ],
        );
  });

  const make = async () => {
    setIsMaking(true);

    const answer = await createImportLibraries(source.id, { libraries: wanted });

    setIsMaking(false);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    setMade(
      answer.value.libraries.map((created) => ({
        created,
        name:
          wanted.find((one) => one.sourcePath === created.sourcePath)?.name ?? created.sourcePath,
      })),
    );
    setScanning(
      new Set(
        answer.value.libraries.flatMap((created) =>
          created.jobId === null ? [] : [created.jobId],
        ),
      ),
    );
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <PanelCard title={say('screens.importWizard.librariesStep.whereAreTheFolders')}>
        <PathMappings
          sourceName={source.name}
          mappings={read.mappings}
          isSaving={isSaving}
          onSave={(mappings) => {
            void save(mappings);
          }}
        />
      </PanelCard>

      <PanelCard title={say('common.libraries')}>
        <ul className="flex flex-col gap-5">
          {read.libraries.map((library) => (
            <li key={library.sourceLibraryId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text">{library.name}</span>

                {library.kind === null ? null : (
                  <Badge size="sm" tone="quiet">
                    {LIBRARY_KIND_NAMES[library.kind].label}
                  </Badge>
                )}
              </div>

              {library.kind === null ? (
                <p className="text-sm text-text-muted">
                  {say('screens.importWizard.librariesStep.valenceHasNoLibraryLikeThis')}
                </p>
              ) : (
                library.locations.map((location) => {
                  const key = keyOf(library.sourceLibraryId, location.sourcePath);

                  return (
                    <div key={key} className="flex flex-col gap-1 pl-2">
                      <span className="font-mono text-xs text-text-muted">
                        {say('screens.importWizard.librariesStep.sourcePathBecomesValencePath', {
                          sourcePath: location.sourcePath,
                          valencePath: location.valencePath,
                        })}
                      </span>

                      <Choice
                        label={say('screens.importWizard.librariesStep.comesInto')}
                        value={location.libraryId ?? (unwanted.has(key) ? LEFT_OUT : NEW_LIBRARY)}
                        options={[
                          ...(location.libraryId === null
                            ? [
                                {
                                  id: NEW_LIBRARY,
                                  label: say(
                                    'screens.importWizard.librariesStep.makeAndScanThisLibrary',
                                  ),
                                },
                              ]
                            : []),
                          ...ours
                            .filter(
                              (one) => one.kind === library.kind || one.id === location.libraryId,
                            )
                            .map((one) => ({ id: one.id, label: one.name })),
                          ...(location.libraryId === null
                            ? [
                                {
                                  id: LEFT_OUT,
                                  label: say('screens.importWizard.librariesStep.leaveItOut'),
                                },
                              ]
                            : []),
                        ]}
                        onSelect={(chosen) => {
                          if (chosen === NEW_LIBRARY || chosen === LEFT_OUT) {
                            setUnwanted((held) => {
                              const next = new Set(held);

                              if (chosen === LEFT_OUT) {
                                next.add(key);
                              } else {
                                next.delete(key);
                              }

                              return next;
                            });

                            return;
                          }

                          void link(library.sourceLibraryId, location.sourcePath, chosen);
                        }}
                      />

                      {location.libraryId === null ? null : (
                        <span>
                          <Badge size="sm" tone="success">
                            {say('screens.importWizard.arrImportStep.alreadyInValence')}
                          </Badge>
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <Button
            variant="secondary"
            isLoading={isMaking}
            disabled={wanted.length === 0}
            onClick={() => {
              void make();
            }}
          >
            {say('screens.importWizard.librariesStep.makeAndScanTheseLibraries')}
          </Button>
        </div>
      </PanelCard>

      {made.length === 0 ? null : (
        <PanelCard title={say('screens.adminArea.describeScanKind.scanning')}>
          <div className="flex flex-col gap-4">
            {made.map(({ created, name }) =>
              created.problem !== null ? (
                <p key={created.sourcePath} role="alert" className="text-sm text-danger">
                  {sayAgain(created.problem)}
                </p>
              ) : created.jobId === null ? null : (
                <ScanFollower
                  key={created.jobId}
                  jobId={created.jobId}
                  name={name}
                  onSettled={settled}
                />
              ),
            )}
          </div>
        </PanelCard>
      )}

      {scanning.size === 0 ? null : (
        <p className="text-sm text-text-muted">
          {say('screens.importWizard.librariesStep.waitForTheScansToFinish')}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="-ml-3" onClick={onBack}>
          {say('common.back')}
        </Button>

        <Button variant="confirm" size="lg" disabled={scanning.size > 0} onClick={onContinue}>
          {say('common.continue')}
        </Button>
      </div>
    </div>
  );
};

LibrariesStep.displayName = 'LibrariesStep';

export { LibrariesStep };
