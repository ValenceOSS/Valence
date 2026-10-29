import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';
import { saveDevicePlacement } from '@ValenceClient/admin/saveDevicePlacement';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { DevicePlacement } from './DevicePlacement';

vi.mock('@ValenceClient/admin/saveDevicePlacement', () => ({ saveDevicePlacement: vi.fn() }));

const device = (id: string, name: string, position: number): PlacedDevice => ({
  id,
  name,
  vendor: 'other',
  accels: ['vaapi'],
  probed: true,
  encoders: ['h264_vaapi'],
  capacity: 4,
  streams: 0,
  busyPercent: null,
  isOn: true,
  maxStreams: null,
  position,
});

const TWO = [device('a', 'First card', 0), device('b', 'Second card', 1)];

const overview = (spreadAcrossDevices: boolean): AdminOverview => ({
  users: [],
  settings: {
    hasCatalogueKey: false,
    hasAudioDbKey: false,
    hasOmdbKey: false,
    cookieSecure: false,
    trustedOrigins: [],
    hardwareAccel: '',
    spreadAcrossDevices,
    hardwareDevices: [],
    whenDevicesFull: 'software',
    previewQuality: 'high',
    showsProfilesBeforeSignIn: false,
    fetchesCatalogueTrailers: false,
    usesShortSegments: true,
    playsEpisodesGapless: true,
    fetchesMusicDetails: false,
    requestReleaseTypes: ['album'],
    controlsConnectedApps: false,
    certificationRegion: 'GB',
    keepsDownloadsForDays: 14,
    telemetryEnabled: true,
    isTelemetryOffByEnvironment: false,
  },
  transcoder: {
    isReachable: true,
    address: '',
    ffmpegVersion: null,
    ffmpegSupported: true,
    hardwareAccels: [],
    concurrentRenders: 0,
    toneMapping: 'unavailable',
    hardwareToneMaps: [],
    unreadableLibraries: [],
    chains: [],
  },
  hardware: null,
  library: { itemCount: 0, libraryCount: 0, bytes: 0 },
  artwork: null,
  bookPages: null,
  jobs: { stalled: [] },
  playback: { stoppedLastDay: 0 },
});

beforeEach(() => {
  vi.mocked(saveDevicePlacement).mockReset();
  vi.mocked(saveDevicePlacement).mockResolvedValue(true);
});

describe('DevicePlacement', () => {
  it('shows nothing before the media service has said what it has', () => {
    const { container } = render(<DevicePlacement overview={overview(false)} devices={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says there is only one device where there is nothing to spread across', () => {
    render(<DevicePlacement overview={overview(false)} devices={[device('a', 'Only card', 0)]} />);

    expect(
      screen.getByText('Only one graphics device was found, so every stream uses it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('spreads streams across devices once switched on, and shows each device', async () => {
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(<DevicePlacement overview={overview(false)} devices={TWO} onSaved={onSaved} />);

    expect(screen.queryByText('First card')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Use more than one graphics device' }));

    expect(saveDevicePlacement).toHaveBeenCalledWith({ spreadAcrossDevices: true });
    expect(screen.getByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Second card')).toBeInTheDocument();
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('switches back off where the change could not be saved', async () => {
    vi.mocked(saveDevicePlacement).mockResolvedValue(false);
    const user = userEvent.setup();

    render(<DevicePlacement overview={overview(false)} devices={TWO} />);

    const toggle = screen.getByRole('switch', { name: 'Use more than one graphics device' });

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('saves a new order when a device is moved', async () => {
    const user = userEvent.setup();

    render(<DevicePlacement overview={overview(true)} devices={TWO} />);

    await user.click(screen.getByRole('button', { name: 'Move Second card up' }));

    expect(saveDevicePlacement).toHaveBeenCalledWith({
      hardwareDevices: [
        { id: 'b', isOn: true, maxStreams: null },
        { id: 'a', isOn: true, maxStreams: null },
      ],
    });
  });

  it('saves a device switched off', async () => {
    const user = userEvent.setup();

    render(<DevicePlacement overview={overview(true)} devices={TWO} />);

    await user.click(screen.getByRole('switch', { name: 'Use First card' }));

    expect(saveDevicePlacement).toHaveBeenCalledWith({
      hardwareDevices: [
        { id: 'a', isOn: false, maxStreams: null },
        { id: 'b', isOn: true, maxStreams: null },
      ],
    });
  });

  it('saves what happens once every device is full', async () => {
    const user = userEvent.setup();

    render(<DevicePlacement overview={overview(true)} devices={TWO} />);

    await user.click(screen.getByRole('button', { name: /When every device is full/ }));
    await user.click(
      await screen.findByRole('menuitemradio', { name: /Put it on the first device anyway/ }),
    );

    expect(saveDevicePlacement).toHaveBeenCalledWith({ whenDevicesFull: 'preferred' });
  });
});
