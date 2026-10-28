import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { DeviceLoadList } from './DeviceLoadList';

const CARD: PlacedDevice = {
  id: 'pci:0000:01:00.0',
  name: 'NVIDIA GeForce RTX 5080',
  vendor: 'nvidia',
  accels: ['nvenc'],
  probed: true,
  encoders: ['h264_nvenc'],
  capacity: 8,
  streams: 2,
  busyPercent: 41.5,
  isOn: true,
  maxStreams: null,
  position: 0,
};

const CHIP: PlacedDevice = {
  ...CARD,
  id: 'pci:0000:00:02.0',
  name: 'Intel UHD Graphics 770',
  vendor: 'intel',
  capacity: 0,
  streams: 1,
  busyPercent: null,
  position: 1,
};

describe('DeviceLoadList', () => {
  it('shows each device, how many streams it has and how busy it is', () => {
    render(<DeviceLoadList devices={[CARD, CHIP]} />);

    expect(screen.getByText('RTX 5080')).toBeInTheDocument();
    expect(screen.getByText('2 of 8 streams')).toBeInTheDocument();
    expect(screen.getByText('UHD Graphics 770')).toBeInTheDocument();
    expect(screen.getByText('1 stream')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });
});
