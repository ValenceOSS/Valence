import { Check as CheckIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { Icon } from '@ValenceUI/Icon';
import type { ReactNode } from 'react';
import type { AdminSetupGuideProps } from './AdminSetupGuide.types';
import { say } from '@ValenceI18n/say';

const CATALOGUE_KEY_PAGE = 'https://www.themoviedb.org/settings/api';

/**
 * The few things a new server needs before anybody can watch anything, in the order to do them: a
 * library to read, a key to look titles up with, and a first scan to do the reading.
 *
 * The first step not yet done is picked out, so somebody arriving cold is told where to start rather
 * than left to work it out from a bare page. It disappears once all three are done, and can be put
 * away sooner by somebody who would rather set the server up their own way.
 *
 * @param hasLibrary - Whether there is a library yet.
 * @param hasCatalogueKey - Whether a metadata catalogue key has been saved.
 * @param hasScanned - Whether any library has been scanned.
 * @param isScanning - Whether a scan of everything is already running.
 * @param onAddLibrary - Told to start adding a library.
 * @param onOpenSettings - Told to open the settings, where the key goes.
 * @param onScanAll - Told to scan every library.
 * @param onHide - Told to put the guide away.
 */
const AdminSetupGuide = ({
  hasLibrary,
  hasCatalogueKey,
  hasScanned,
  isScanning = false,
  onAddLibrary,
  onOpenSettings,
  onScanAll,
  onHide,
}: AdminSetupGuideProps) => {
  if (hasLibrary && hasCatalogueKey && hasScanned) {
    return null;
  }

  const steps: {
    id: string;
    title: string;
    detail: string;
    isDone: boolean;
    actions: ReactNode;
  }[] = [
    {
      id: 'library',
      title: say('common.addALibrary'),
      detail: say('screens.adminArea.adminSetupGuide.aLibraryIsAFolderOf'),
      isDone: hasLibrary,
      actions: (
        <Button variant="glossy" size="sm" onClick={onAddLibrary}>
          {say('common.addLibrary')}
        </Button>
      ),
    },
    {
      id: 'key',
      title: say('screens.adminArea.adminSetupGuide.addAMetadataKey'),
      detail: say('screens.adminArea.adminSetupGuide.titlesArtworkYearsAndRatingsCome'),
      isDone: hasCatalogueKey,
      actions: (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.open(CATALOGUE_KEY_PAGE, '_blank', 'noopener,noreferrer');
            }}
          >
            {say('common.getAFreeKey')}
          </Button>

          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            {say('screens.adminArea.adminSetupGuide.enterItInSettings')}
          </Button>
        </>
      ),
    },
    {
      id: 'scan',
      title: say('screens.adminArea.adminSetupGuide.scanYourLibraries'),
      detail: say('screens.adminArea.adminSetupGuide.scanningReadsWhatIsInEach'),
      isDone: hasScanned,
      actions: (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isScanning}
          disabled={!hasLibrary}
          onClick={onScanAll}
        >
          {say('screens.adminArea.adminSetupGuide.scanAll')}
        </Button>
      ),
    },
  ];

  const next = steps.find((step) => !step.isDone)?.id;

  return (
    <Card
      as="section"
      aria-label={say('screens.setupWizard.setUpValence')}
      padding="md"
      className="flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-text">
            {say('screens.setupWizard.setUpValence')}
          </h2>
          <p className="text-sm text-text-muted">
            {say('screens.adminArea.adminSetupGuide.threeStepsAndYourMediaIs')}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={onHide}>
          {say('common.hide')}
        </Button>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={step.id === next ? 'step' : undefined}
            className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
              step.id === next
                ? 'border-[var(--surface-divider)] bg-[var(--surface-hover)]'
                : 'border-transparent'
            }`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                step.isDone ? 'bg-success/15 text-success' : 'bg-surface-raised text-text-muted'
              }`}
            >
              {step.isDone ? <Icon of={CheckIcon} size={14} /> : (index + 1).toString()}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-text">
                {step.title}
                {step.id === next ? (
                  <Badge tone="accent" size="sm">
                    {say('screens.adminArea.adminSetupGuide.startHere')}
                  </Badge>
                ) : null}
              </span>

              <span className="text-sm text-text-muted">{step.detail}</span>
            </div>

            {step.isDone ? null : (
              <div className="flex shrink-0 flex-wrap gap-2">{step.actions}</div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
};

AdminSetupGuide.displayName = 'AdminSetupGuide';

export { AdminSetupGuide };
