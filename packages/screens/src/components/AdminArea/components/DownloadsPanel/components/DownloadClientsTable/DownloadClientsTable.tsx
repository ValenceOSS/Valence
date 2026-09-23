import { useMemo } from 'react';
import {
  Bin as BinIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Pen as PenIcon,
  Plug as PlugIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@keyline-icons/react';
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

const KIND_LABELS: Readonly<Record<DownloadClientKind, string>> = {
  qbittorrent: 'qBittorrent',
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
        header: 'Client',
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
        header: 'Priority',
        accessorFn: (client) => client.priority,
        cell: ({ row }) => <span className="text-sm text-text">{row.original.priority}</span>,
      },
      {
        id: 'state',
        header: 'State',
        accessorFn: (client) => describeClientState(client.isEnabled, byId.get(client.id)).label,
        cell: ({ row }) => {
          const state = describeClientState(row.original.isEnabled, byId.get(row.original.id));

          return testingId === row.original.id ? (
            <Spinner size="sm" label={`Testing ${row.original.name}`} />
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
        header: 'Speed',
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
              label={`Actions for ${row.original.name}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'change',
                      label: 'Change',
                      icon: <Icon of={PenIcon} size={15} />,
                      onChoose: () => {
                        onChange(row.original);
                      },
                    },
                    {
                      id: 'test',
                      label: 'Test',
                      detail: 'Logs in and asks which version it is.',
                      icon: <Icon of={PlugIcon} size={15} />,
                      isDisabled: testingId !== null,
                      onChoose: () => {
                        onTest(row.original);
                      },
                    },
                    {
                      id: 'switch',
                      label: row.original.isEnabled ? 'Switch off' : 'Switch on',
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
                      label: 'Remove',
                      icon: <Icon of={BinIcon} size={15} />,
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
      label="Download clients"
      columns={columns}
      rows={[...clients]}
      getRowId={(client) => client.id}
      emptyMessage="No download clients yet. Add qBittorrent or Transmission for torrents, or SABnzbd or NZBGet for usenet, to send releases to."
    />
  );
};

DownloadClientsTable.displayName = 'DownloadClientsTable';

export { DownloadClientsTable };
