import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from '@ValenceUI/DataTable';
import { ReadDeviceSchema } from '@ValenceContracts/schemas/SignedInDevice';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import { deviceColumns } from './deviceColumns';

const DEVICE = ReadDeviceSchema.parse({
  id: 'one',
  name: sayVerbatim('Mac · Chrome on macOS'),
  device: saying('common.mac'),
  client: saying('core.nameTheClient.browserOn', { browser: 'Chrome', system: 'macOS' }),
  identity: identifyDevice({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36',
    brands: ['Google Chrome'],
  }),
  address: '192.168.1.4',
  signedInAt: '2026-10-16T20:00:00.000Z',
  lastActiveAt: '2026-10-30T20:00:00.000Z',
  expiresAt: '2026-11-16T20:00:00.000Z',
});

describe('deviceColumns', () => {
  it('names each device, when it was last used and when it signed in, with a menu', () => {
    expect(deviceColumns({ onEnd: vi.fn() }).map((column) => column.id)).toEqual([
      'name',
      'lastActive',
      'signedIn',
      'act',
    ]);
  });

  it('leaves out the menu where nobody may rename or sign out', () => {
    expect(deviceColumns({ onEnd: null }).map((column) => column.id)).toEqual([
      'name',
      'lastActive',
      'signedIn',
    ]);
  });

  it('names the device and what it reaches Valence through on separate lines', () => {
    render(<DataTable label="Devices" columns={deviceColumns({ onEnd: null })} rows={[DEVICE]} />);

    expect(screen.getByText('Mac')).toBeInTheDocument();
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.4')).toBeInTheDocument();
  });

  it('marks the device the list is open on', () => {
    render(
      <DataTable
        label="Devices"
        columns={deviceColumns({ onEnd: vi.fn() })}
        rows={[{ ...DEVICE, isCurrent: true }]}
      />,
    );

    expect(screen.getByText('This device')).toBeInTheDocument();
  });

  it('says a device in use right now is active now, rather than when it was last seen', () => {
    render(
      <DataTable
        label="Devices"
        columns={deviceColumns({ onEnd: null })}
        rows={[{ ...DEVICE, isActiveNow: true }]}
      />,
    );

    expect(screen.getByText('Active now')).toBeInTheDocument();
  });
});
