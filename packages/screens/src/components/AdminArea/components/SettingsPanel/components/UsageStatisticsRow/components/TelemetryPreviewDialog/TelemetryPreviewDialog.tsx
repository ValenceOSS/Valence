import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Link } from '@ValenceUI/Link';
import { Spinner } from '@ValenceUI/Spinner';
import { fetchTelemetryPreview } from '@ValenceClient/admin/fetchTelemetryPreview';
import { resetTelemetryInstallId } from '@ValenceClient/admin/resetTelemetryInstallId';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { TELEMETRY_DOCS } from '@ValenceScreens/admin/TELEMETRY_DOCS';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { say } from '@ValenceI18n/say';
import type {
  TelemetryHeldOffReason,
  TelemetryPreview,
} from '@ValenceContracts/schemas/TelemetryPreview';
import type { TelemetryPreviewDialogProps } from './TelemetryPreviewDialog.types';

const HELD_OFF_BECAUSE: Readonly<Record<TelemetryHeldOffReason, string>> = {
  setting: say('screens.adminArea.telemetryPreviewDialog.sharingIsTurnedOffSoNothingIsSent'),
  environment: say('common.anonymousStatisticsAreTurnedOffByTheEnvironment'),
  setup: say('screens.adminArea.telemetryPreviewDialog.nothingIsSentUntilSetupIsFinished'),
};

/**
 * The whole anonymous report this server sends once a day, exactly as it would go, read afresh each
 * time it opens, with what holds it back where something does and a way to make a new install id.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called to close it.
 */
const TelemetryPreviewDialog = ({ isOpen, onClose }: TelemetryPreviewDialogProps) => {
  const [preview, setPreview] = useState<TelemetryPreview | null>(null);
  const [isUnreadable, setIsUnreadable] = useState(false);
  const [isMaking, setIsMaking] = useState(false);
  const [reading, setReading] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isCurrent = true;

    setIsUnreadable(false);

    void fetchTelemetryPreview().then(
      (read) => {
        if (isCurrent) {
          setPreview(read);
        }
      },
      () => {
        if (isCurrent) {
          setIsUnreadable(true);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [isOpen, reading]);

  return (
    <Dialog
      label={say('screens.adminArea.telemetryPreviewDialog.whatThisServerSends')}
      isOpen={isOpen}
      onClose={onClose}
      className="sm:w-[min(40rem,92vw)]"
    >
      <DialogTitle
        title={say('screens.adminArea.telemetryPreviewDialog.whatThisServerSends')}
        detail={
          <Sentence
            words="screens.adminArea.telemetryPreviewDialog.thisIsTheWholeReportLink"
            fillings={{ link: <Link href={TELEMETRY_DOCS}>{say('common.whatIsSentAndWhy')}</Link> }}
          />
        }
      />

      <DialogContent>
        {preview === null ? (
          isUnreadable ? (
            <p role="alert" className="text-sm text-danger">
              {say('screens.adminArea.telemetryPreviewDialog.theReportCouldNotBeRead')}
            </p>
          ) : (
            <Spinner size="sm" label={say('common.loading')} isCentered />
          )
        ) : (
          <div className="flex flex-col gap-3">
            {preview.heldOffBy === null ? null : (
              <Callout tone="quiet" title={HELD_OFF_BECAUSE[preview.heldOffBy]} />
            )}

            <pre
              aria-label={say('screens.adminArea.telemetryPreviewDialog.theReport')}
              className="max-h-[50vh] overflow-auto rounded-lg border border-[var(--surface-line)] bg-[var(--surface-hover)] px-3 py-2.5 font-mono text-xs leading-relaxed text-text"
            >
              {JSON.stringify(preview.report, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>

      <DialogFooter
        lead={
          <Button
            variant="secondary"
            size="sm"
            isLoading={isMaking}
            disabled={preview === null}
            onClick={() => {
              setIsMaking(true);

              void resetTelemetryInstallId().then((answer) => {
                setIsMaking(false);

                if (
                  tellOutcome(
                    say('screens.adminArea.telemetryPreviewDialog.aNewInstallIdWasMade'),
                    answer.kind === 'answered'
                      ? null
                      : say('screens.adminArea.telemetryPreviewDialog.aNewInstallIdCouldNotBeMade'),
                  )
                ) {
                  setReading((count) => count + 1);
                }
              });
            }}
          >
            {say('screens.adminArea.telemetryPreviewDialog.makeANewInstallId')}
          </Button>
        }
        confirm={{ label: say('common.done'), onChoose: onClose }}
      />
    </Dialog>
  );
};

TelemetryPreviewDialog.displayName = 'TelemetryPreviewDialog';

export { TelemetryPreviewDialog };
