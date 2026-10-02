import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react/fill';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { fetchLibraries, scanLibrary } from '@ValenceClient/library/fetchLibrary';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { AddLibraryDialog } from '@ValenceScreens/components/AddLibraryDialog/AddLibraryDialog';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { ScanFollower } from '@ValenceScreens/components/ScanFollower/ScanFollower';
import { SetupStepFrame } from '@ValenceScreens/components/SetupWizard/components/SetupStepFrame/SetupStepFrame';
import type { AddLibrariesStepProps } from './AddLibrariesStep.types';

/**
 * Where the media is: each library added the way the admin area adds one, then read straight away,
 * with each read followed live. It can be left empty, since bringing a server across makes its
 * libraries for it, and reading carries on while setup moves on.
 *
 * @param libraries - The libraries there are, once read.
 * @param scans - The scan started for each library added here, by library.
 * @param onRead - Told the libraries already on the server.
 * @param onAdded - Told each library added, with the scan started for it.
 * @param onBack - Told to go back a step.
 * @param onContinue - Told to go on.
 */
const AddLibrariesStep = ({
  libraries,
  scans,
  onRead,
  onAdded,
  onBack,
  onContinue,
}: AddLibrariesStepProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (libraries !== null) {
      return;
    }

    void fetchLibraries()
      .then(onRead)
      .catch(() => {
        onRead([]);
      });
  }, [libraries, onRead]);

  const hasAny = libraries !== null && libraries.length > 0;

  return (
    <SetupStepFrame
      title={say('screens.setupWizard.addLibrariesStep.yourLibraries')}
      lead={say('screens.setupWizard.addLibrariesStep.aLibraryIsAFolderOfOneKind')}
      back={
        <Button variant="ghost" onClick={onBack}>
          {say('common.back')}
        </Button>
      }
      actions={
        <>
          {hasAny ? null : (
            <Button variant="ghost" onClick={onContinue}>
              {say('screens.setupWizard.skipForNow')}
            </Button>
          )}

          <Button variant="confirm" size="lg" disabled={!hasAny} onClick={onContinue}>
            {say('common.continue')}
            <Icon of={ArrowRightIcon} size={16} />
          </Button>
        </>
      }
    >
      {libraries === null ? (
        <Spinner size="sm" label={say('screens.importWizard.librariesStep.readingTheLibraries')} />
      ) : (
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {libraries.map((library) => {
              const jobId = scans.get(library.id) ?? null;

              return (
                <motion.li
                  key={library.id}
                  layout="position"
                  initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={revealTransition(prefersReducedMotion)}
                  className="flex flex-col gap-3 border-b border-[var(--surface-line)] py-4 first:pt-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-text">
                          {library.name}
                        </span>

                        <Badge size="sm" tone="quiet">
                          {LIBRARY_KIND_NAMES[library.kind].label}
                        </Badge>
                      </span>

                      <span className="truncate font-mono text-xs text-text-muted">
                        {library.path}
                      </span>
                    </div>

                    {jobId === null ? (
                      <span className="shrink-0 text-xs text-text-muted">
                        {sayCount('common.count.items', library.itemCount)}
                      </span>
                    ) : null}
                  </div>

                  {jobId === null ? null : (
                    <ScanFollower jobId={jobId} name={library.name} onSettled={() => undefined} />
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>

          <li className={hasAny ? 'pt-4' : ''}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAdding(true);
              }}
            >
              <Icon of={PlusIcon} size={16} />
              {hasAny
                ? say('screens.setupWizard.addLibrariesStep.addAnother')
                : say('common.addALibrary')}
            </Button>
          </li>
        </ul>
      )}

      {hasAny ? (
        <p className="text-sm text-text-muted">
          {say('screens.setupWizard.addLibrariesStep.readingCarriesOn')}
        </p>
      ) : (
        <p className="text-sm text-text-muted">
          {say('screens.setupWizard.addLibrariesStep.comingFromAnotherServer')}
        </p>
      )}

      <AddLibraryDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onCreated={(library) => {
          setIsAdding(false);

          void scanLibrary(library.id).then((scan) => {
            onAdded(library, scan?.jobId ?? null);
          });
        }}
      />
    </SetupStepFrame>
  );
};

AddLibrariesStep.displayName = 'AddLibrariesStep';

export { AddLibrariesStep };
