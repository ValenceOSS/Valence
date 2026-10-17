import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from '@ValenceUI/DataTable';
import { deviceColumns } from './deviceColumns';

const DEVICE = {
  id: 'one',
  name: { code: null, message: 'Chrome on macOS', values: {} },
  address: '192.168.1.4',
  signedInAt: '2026-10-16T20:00:00.000Z',
  expiresAt: '2026-11-16T20:00:00.000Z',
};

describe('deviceColumns', () => {
  it('names each device, where it was and when it signed in, with a way to sign it out', () => {
    expect(deviceColumns(vi.fn()).map((column) => column.id)).toEqual(['name', 'signedIn', 'act']);
  });

  it('leaves out the way to sign a device out where nobody may', () => {
    expect(deviceColumns(null).map((column) => column.id)).toEqual(['name', 'signedIn']);
  });

  it('marks the device the list is open on', () => {
    render(
      <DataTable
        label="Devices"
        columns={deviceColumns(vi.fn())}
        rows={[{ ...DEVICE, isCurrent: true }]}
      />,
    );

    expect(screen.getByText('This device')).toBeInTheDocument();
  });
});
