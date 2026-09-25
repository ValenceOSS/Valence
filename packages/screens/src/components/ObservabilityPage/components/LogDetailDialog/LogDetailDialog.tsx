import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Button } from '@ValenceUI/Button';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import type { ReactNode } from 'react';
import type { LogDetailDialogProps } from './LogDetailDialog.types';

type RowProps = {
  name: string;
  children: ReactNode;
};

/**
 * One labelled fact about the record, laid out so the labels line up and long values wrap rather
 * than pushing the dialog wide.
 *
 * @param name - What the fact is.
 * @param children - The fact itself.
 */
const Row = ({ name, children }: RowProps) => (
  <div className="flex gap-3 rounded-md px-1 py-1.5 text-sm">
    <dt className="w-28 shrink-0 text-text-muted">{name}</dt>
    <dd className="min-w-0 break-words font-medium text-text">{children}</dd>
  </div>
);

Row.displayName = 'Row';

/**
 * Everything known about one log record.
 *
 * Opened rather than shown in the row because the part of a message that would be cut is the reason,
 * and a stack trace or the tail of what ffmpeg said is exactly what somebody came here to read —
 * neither of which fits a table row without ruining the table.
 *
 * @param record - The record being read, or null when none is.
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onOpenJob - Called with a job's id when its context field is chosen, rather than only read.
 * @returns The dialog.
 */
const LogDetailDialog = ({ record, isOpen, onClose, onOpenJob }: LogDetailDialogProps) => {
  const said =
    record === null
      ? []
      : Object.entries(record.context).filter(
          (entry): entry is [string, string] => entry[1] !== null,
        );

  return (
    <DialogCompanion
      label={say('screens.logDetailDialog.title')}
      isOpen={isOpen && record !== null}
      onClose={onClose}
    >
      <DialogTitle size="compact" title={say('screens.logDetailDialog.title')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent>
        {record !== null && (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col divide-y divide-[var(--surface-line)]">
              <Row name={say('screens.logDetailDialog.whenTerm')}>
                {say('screens.logDetailDialog.when', {
                  day: describeLogDay(record.atMs),
                  time: describeLogTime(record.atMs),
                })}
              </Row>
              <Row name={say('screens.logDetailDialog.levelTerm')}>{record.level}</Row>
              <Row name={say('screens.logDetailDialog.sourceTerm')}>{record.source}</Row>

              {record.count > 1 && (
                <Row name={say('screens.logDetailDialog.happenedTerm')}>
                  {sayCount('screens.logDetailDialog.times', record.count)}
                </Row>
              )}

              {said.map(([name, value]) => (
                <Row key={name} name={name}>
                  {name === 'jobId' && onOpenJob !== undefined ? (
                    <Button
                      variant="link"
                      size="none"
                      hasTooltip={false}
                      onClick={() => {
                        onOpenJob(value);
                      }}
                    >
                      {value}
                    </Button>
                  ) : (
                    value
                  )}
                </Row>
              ))}
            </dl>

            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">
              {record.message}
            </p>

            {record.detail !== null && (
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--surface-hover)] px-3 py-2 font-mono text-xs leading-relaxed text-text-muted">
                {record.detail}
              </pre>
            )}
          </div>
        )}
      </DialogContent>
    </DialogCompanion>
  );
};

LogDetailDialog.displayName = 'LogDetailDialog';

export { LogDetailDialog };
