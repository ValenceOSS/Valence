import { useMemo } from 'react';
import {
  MoreHorizontal as MoreHorizontalIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Pen as PenFilledIcon,
  Plug as PlugFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { describeClientState } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeClientState';
import { ReadoutLines } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/components/ReadoutLines/ReadoutLines';
import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';
import { HowToFix } from '@ValenceScreens/components/HowToFix/HowToFix';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { DownloadClient, DownloadClientKind } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientsTableProps } from './DownloadClientsTable.types';
import { say } from '@ValenceI18n/say';

const KIND_LABELS: Readonly<Record<DownloadClientKind, string>> = {
  qbittorrent: 'qBittorrent',
  // eslint-disable-next-line valence/no-hard-coded-strings -- a download client's product name, never translated
  transmission: 'Transmission',
  sabnzbd: 'SABnzbd',
  nzbget: 'NZBGet',
};

/**
 * Every download client, in the order releases are offered to them: what each is and where, whether
 * it answers and why not, how fast it is going altogether, and the things that can be done to it —
 * changing it, testing it, switching it on or off, and removing it.
 *
 * @param clients - The clients.
 * @param readings - What the queue last heard from each.
 * @param testingId - The client being tested, whose state waits until it is done.
 * @param onChange - Called to change a client.
 * @param onTest - Called to test one.
 * @param onSwitch - Called to switch one on or off.
 * @param onRemove - Called to remove one.
 */
const DownloadClientsTable = ({
  clients,
  readings,
  testingId,
  onChange,
  onTest,
  onSwitch,
  onRemove,
}: DownloadClientsTableProps) => {
  const byId = useMemo(() => new Map(readings.map((reading) => [reading.id, reading])), [readings]);

  const columns = useMemo<DataTableColumn<DownloadClient>[]>(
    () => [
      {
        id: 'name',
        header: say('admin.downloadClientsTable.client'),
        accessorFn: (client) => client.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.name}</span>
              <Badge size="sm">{KIND_LABELS[row.original.kind]}</Badge>
            </span>

            <span className="truncate text-xs text-text-muted">{row.original.url}</span>
          </span>
        ),
      },
      {
        id: 'priority',
        header: say('admin.downloadClientsTable.priority'),
        accessorFn: (client) => client.priority,
        cell: ({ row }) => <span className="text-sm text-text">{row.original.priority}</span>,
      },
      {
        id: 'state',
        header: say('admin.downloadClientsTable.state'),
        accessorFn: (client) => describeClientState(client.isEnabled, byId.get(client.id)).label,
        cell: ({ row }) => {
          const state = describeClientState(row.original.isEnabled, byId.get(row.original.id));

          return testingId === row.original.id ? (
            <Spinner
              size="sm"
              label={say('admin.downloadClientsTable.testing', { name: row.original.name })}
            />
          ) : (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={state.tone}>
                {state.label}
              </Badge>

              {state.detail === null ? null : (
                <span className="text-xs text-text-muted">{state.detail}</span>
              )}

              <HowToFix href={state.help} />
            </span>
          );
        },
      },
      {
        id: 'speed',
        header: say('admin.downloadClientsTable.speed'),
        accessorFn: (client) => byId.get(client.id)?.downloadBytesPerSecond ?? -1,
        cell: ({ row }) => {
          const reading = byId.get(row.original.id);

          return (
            <ReadoutLines
              lines={
                reading?.isReachable === true
                  ? speedsOf(reading.downloadBytesPerSecond, reading.uploadBytesPerSecond)
                  : []
              }
            />
          );
        },
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={say('admin.downloadClientsTable.actionsFor', { name: row.original.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'change',
                      label: say('admin.downloadClientsTable.change'),
                      icon: <Icon of={PenFilledIcon} size={15} />,
                      onChoose: () => {
                        onChange(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: say('admin.downloadClientsTable.test'),
                      detail: say('admin.downloadClientsTable.testDetail'),
                      icon: <Icon of={PlugFilledIcon} size={15} />,
                      isDisabled: testingId !== null,
                      onChoose: () => {
                        onTest(row.original);
                      },
                    },
                    {
                      id: 'switch',
                      label: row.original.isEnabled
                        ? say('admin.downloadClientsTable.switchOff')
                        : say('admin.downloadClientsTable.switchOn'),
                      icon: (
                        <Icon
                          of={row.original.isEnabled ? ToggleOffIcon : ToggleOnIcon}
                          size={15}
                        />
                      ),
                      onChoose: () => {
                        onSwitch(row.original);
                      },
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'remove',
                      label: say('admin.downloadClientsTable.remove'),
                      icon: <Icon of={BinFilledIcon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        onRemove(row.original);
                      },
                    },
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [byId, testingId, onChange, onTest, onSwitch, onRemove],
  );

  return (
    <DataTable
      label={say('admin.downloadClientsTable.label')}
      columns={columns}
      rows={[...clients]}
      getRowId={(client) => client.id}
      emptyMessage={say('admin.downloadClientsTable.empty')}
    />
  );
};

DownloadClientsTable.displayName = 'DownloadClientsTable';

export { DownloadClientsTable };
