import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HardwareTestResult } from './HardwareTestResult';

const REPORT = {
  accel: 'nvenc',
  encoder: 'h264_nvenc',
  decodesOnDevice: true,
  encodesOnDevice: true,
  speed: 14.2,
  softwareSpeed: 3.1,
  reason: null,
};

describe('HardwareTestResult', () => {
  it('shows nothing before a test has answered', () => {
    const { container } = render(<HardwareTestResult report={null} hasFailed={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says the hardware is working, how, and how fast', () => {
    render(<HardwareTestResult report={REPORT} hasFailed={false} />);

    expect(screen.getByText('NVENC is working')).toBeInTheDocument();
    expect(screen.getByText('Decoded on the device')).toBeInTheDocument();
    expect(screen.getByText('Encoded with h264_nvenc')).toBeInTheDocument();
    expect(screen.getByText('14.2× real time')).toBeInTheDocument();
  });

  it('says plainly why it fell back to software', () => {
    render(
      <HardwareTestResult
        report={{
          ...REPORT,
          accel: 'vaapi',
          encoder: 'h264_vaapi',
          decodesOnDevice: false,
          encodesOnDevice: false,
          speed: null,
          reason: 'No VA display found for device /dev/dri/renderD128',
        }}
        hasFailed={false}
      />,
    );

    expect(
      screen.getByText('VAAPI didn’t work, so transcodes fall back to software'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No VA display found for device /dev/dri/renderD128'),
    ).toBeInTheDocument();
  });

  it('says transcodes run in software where no hardware encoder is used', () => {
    render(
      <HardwareTestResult
        report={{ ...REPORT, accel: 'none', encoder: 'libx264', encodesOnDevice: false }}
        hasFailed={false}
      />,
    );

    expect(screen.getByText('Transcodes run in software')).toBeInTheDocument();
  });

  it('says so where the test could not be run', () => {
    render(<HardwareTestResult report={null} hasFailed />);

    expect(
      screen.getByText('The test couldn’t be run. Check that the media service is reachable.'),
    ).toBeInTheDocument();
  });
});
