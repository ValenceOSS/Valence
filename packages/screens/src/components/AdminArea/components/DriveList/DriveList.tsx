import { HardDrive as HardDriveIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { InfoNote } from '@ValenceUI/InfoNote';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import type { DriveListProps } from './DriveList.types';
import { say } from '@ValenceI18n/say';

/**
 * Every physical drive in the machine: what it is, how it stores and is attached, and how big it
 * is.
 *
 * @param hardware - What the machine is built from.
 */
const DriveList = ({ hardware }: DriveListProps) => (
  <>
    <span className="block px-2.5 pb-0.5 pt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
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

        return (
          <li key={drive.name} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
            <Icon of={HardDriveIcon} size={16} tone="muted" className="shrink-0" />

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
            </span>

            <span className="shrink-0 font-medium tabular-nums text-text">
              <FormattedBytes bytes={drive.totalBytes} />
            </span>
          </li>
        );
      })}
    </ul>

    {hardware.surroundings === 'virtualMachine' ? (
      <InfoNote>{say('screens.adminArea.hardware.insideAVirtualMachine')}</InfoNote>
    ) : null}
  </>
);

DriveList.displayName = 'DriveList';

export { DriveList };
