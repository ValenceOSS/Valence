import { Check as CheckIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { Icon } from '@ValenceUI/Icon';
import type { ReactNode } from 'react';
import type { AdminSetupGuideProps } from './AdminSetupGuide.types';

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
      title: 'Add a library',
      detail:
        'A library is a folder of one kind of media: films, shows, music or books. Point Valence at it and it takes care of the rest.',
      isDone: hasLibrary,
      actions: (
        <Button variant="glossy" size="sm" onClick={onAddLibrary}>
          Add library
        </Button>
      ),
    },
    {
      id: 'key',
      title: 'Add a metadata key',
      detail:
        'Titles, artwork, years and ratings come from The Movie Database. A free key takes a minute to get: sign in there, open Settings, then API.',
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
            Get a free key
          </Button>

          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            Enter it in Settings
          </Button>
        </>
      ),
    },
    {
      id: 'scan',
      title: 'Scan your libraries',
      detail:
        'Scanning reads what is in each folder and looks it all up. Nothing can be watched until it has run.',
      isDone: hasScanned,
      actions: (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isScanning}
          disabled={!hasLibrary}
          onClick={onScanAll}
        >
          Scan all
        </Button>
      ),
    },
  ];

  const next = steps.find((step) => !step.isDone)?.id;

  return (
    <Card as="section" aria-label="Get Valence set up" padding="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-text">Get Valence set up</h2>
          <p className="text-sm text-text-muted">Three steps, and your media is ready to watch.</p>
        </div>

        <Button variant="ghost" size="sm" onClick={onHide}>
          Hide
        </Button>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={step.id === next ? 'step' : undefined}
            className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
              step.id === next ? 'border-accent/40 bg-accent/10' : 'border-transparent'
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
                    Start here
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
