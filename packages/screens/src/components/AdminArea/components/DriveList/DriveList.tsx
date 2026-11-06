import { cn } from '@ValenceUI/cn';
import { GROUP_LABEL } from '@ValenceUI/tokens/GROUP_LABEL';
import { HardDrive as HardDriveIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { InfoNote } from '@ValenceUI/InfoNote';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { DriveListProps } from './DriveList.types';
import { say } from '@ValenceI18n/say';

/**
 * Every physical drive in the machine: what it is, how it stores and is attached, and how big it
 * is, how full it is where a filesystem on it can be seen, and how fast it is reading and writing
 * right now, then how many of its SATA ports are free, which says ports rather than bays.
 *
 * @param hardware - What the machine is built from.
 * @param activity - How busy and how full each drive is now, by its name.
 */
const DriveList = ({ hardware, activity }: DriveListProps) => (
  <>
    <span className={cn('block px-2.5 pb-0.5 pt-1', GROUP_LABEL)}>
      {say('screens.adminArea.hardware.drives')}
    </span>

    <ul className="flex flex-col">
      {hardware.drives.map((drive) => {
        const kind =
          drive.kind === 'ssd'
            ? say('screens.adminArea.hardware.ssd')
            : drive.kind === 'hdd'
              ? say('screens.adminArea.hardware.hardDisk')
              : null;
        const how = [drive.connection, kind].filter((part) => part !== null);
        const now = activity.find((one) => one.name === drive.name);

        return (
          <li key={drive.name} className="flex items-start gap-2.5 rounded-md px-2.5 py-1.5">
            <Icon of={HardDriveIcon} size={16} tone="muted" className="mt-0.5 shrink-0" />

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-text">{drive.model ?? drive.name}</span>

              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <span>{drive.name}</span>
                {how.map((part) => (
                  <span key={part} className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-1 rounded-full bg-current" />
                    {part}
                  </span>
                ))}
              </span>

              {now === undefined ? null : (
                <span className="mt-1.5 flex flex-col gap-1">
                  {now.usedBytes === null || now.filesystemBytes === null ? null : (
                    <>
                      <ProgressBar
                        label={say('screens.adminArea.hardware.usedOfSize', {
                          used: formatBytes(now.usedBytes),
                          size: formatBytes(now.filesystemBytes),
                        })}
                        value={(now.usedBytes / Math.max(now.filesystemBytes, 1)) * 100}
                        isFull
                        isThin
                      />
                      <span className="text-xs tabular-nums text-text-muted">
                        <Sentence
                          words="screens.adminArea.hardware.usedOfSize"
                          fillings={{
                            used: <FormattedBytes bytes={now.usedBytes} />,
                            size: <FormattedBytes bytes={now.filesystemBytes} />,
                          }}
                        />
                      </span>
                    </>
                  )}

                  <span className="flex gap-3 text-xs tabular-nums text-text-muted">
                    <Sentence
                      words="screens.adminArea.hardware.readAt"
                      fillings={{
                        speed: <FormattedBytes bytes={now.readBytesPerSecond} suffix="/s" />,
                      }}
                    />
                    <Sentence
                      words="screens.adminArea.hardware.writeAt"
                      fillings={{
                        speed: <FormattedBytes bytes={now.writtenBytesPerSecond} suffix="/s" />,
                      }}
                    />
                  </span>
                </span>
              )}
            </span>

            <span className="shrink-0 self-start font-medium tabular-nums text-text">
              <FormattedBytes bytes={drive.totalBytes} />
            </span>
          </li>
        );
      })}
    </ul>

    {hardware.sataPorts === null || hardware.sataPorts.total === 0 ? null : (
      <span className="block px-2.5 pb-1 pt-0.5 text-xs text-text-muted">
        {say('screens.adminArea.hardware.freeOfSataPorts', {
          free: (hardware.sataPorts.total - hardware.sataPorts.inUse).toLocaleString(),
          total: hardware.sataPorts.total.toLocaleString(),
        })}
      </span>
    )}

    {hardware.surroundings === 'virtualMachine' ? (
      <InfoNote>{say('screens.adminArea.hardware.insideAVirtualMachine')}</InfoNote>
    ) : null}
  </>
);

DriveList.displayName = 'DriveList';

export { DriveList };
