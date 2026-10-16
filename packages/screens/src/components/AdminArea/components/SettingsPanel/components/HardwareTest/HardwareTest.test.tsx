import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testHardware } from '@ValenceClient/admin/testHardware';
import { HardwareTest } from './HardwareTest';

vi.mock('@ValenceClient/admin/testHardware', () => ({ testHardware: vi.fn() }));

const REPORT = {
  accel: 'nvenc',
  encoder: 'h264_nvenc',
  decodesOnDevice: true,
  encodesOnDevice: true,
  speed: 14.2,
  softwareSpeed: 3.1,
  reason: null,
};

beforeEach(() => {
  vi.mocked(testHardware).mockReset();
});

describe('HardwareTest', () => {
  it('tries the backend chosen, and says it is working, how, and how fast', async () => {
    vi.mocked(testHardware).mockResolvedValue(REPORT);
    const user = userEvent.setup();

    render(<HardwareTest accel="nvenc" />);

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(testHardware).toHaveBeenCalledWith('nvenc');
    expect(await screen.findByText('NVENC is working')).toBeInTheDocument();
    expect(screen.getByText('Decoded on the device')).toBeInTheDocument();
    expect(screen.getByText('Encoded with h264_nvenc')).toBeInTheDocument();
    expect(screen.getByText('14.2× real time')).toBeInTheDocument();
  });

  it('says plainly why it fell back to software', async () => {
    vi.mocked(testHardware).mockResolvedValue({
      ...REPORT,
      accel: 'vaapi',
      encoder: 'h264_vaapi',
      decodesOnDevice: false,
      encodesOnDevice: false,
      speed: null,
      reason: 'No VA display found for device /dev/dri/renderD128',
    });
    const user = userEvent.setup();

    render(<HardwareTest accel="vaapi" />);

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(
      await screen.findByText('VAAPI didn’t work, so transcodes fall back to software'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No VA display found for device /dev/dri/renderD128'),
    ).toBeInTheDocument();
  });

  it('says transcodes run in software where no hardware encoder is used', async () => {
    vi.mocked(testHardware).mockResolvedValue({
      ...REPORT,
      accel: 'none',
      encoder: 'libx264',
      decodesOnDevice: null,
      encodesOnDevice: false,
      speed: null,
    });
    const user = userEvent.setup();

    render(<HardwareTest accel="" />);

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(await screen.findByText('Transcodes run in software')).toBeInTheDocument();
  });

  it('says so where the test could not be run', async () => {
    vi.mocked(testHardware).mockResolvedValue(null);
    const user = userEvent.setup();

    render(<HardwareTest accel="" />);

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(
      await screen.findByText(
        'The test couldn’t be run. Check that the media service is reachable.',
      ),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HardwareTest.displayName).toBe('HardwareTest');
  });
});
