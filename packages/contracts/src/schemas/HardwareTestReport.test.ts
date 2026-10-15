import { describe, expect, it } from 'vitest';
import { HardwareTestReportSchema } from './HardwareTestReport';

describe('HardwareTestReportSchema', () => {
  it('reads a test that ran on the hardware', () => {
    expect(
      HardwareTestReportSchema.parse({
        accel: 'nvenc',
        encoder: 'h264_nvenc',
        decodesOnDevice: true,
        encodesOnDevice: true,
        speed: 14.2,
        softwareSpeed: 3.1,
        reason: null,
      }).speed,
    ).toBe(14.2);
  });

  it('reads one that fell back, with why', () => {
    expect(
      HardwareTestReportSchema.parse({
        accel: 'vaapi',
        encoder: 'h264_vaapi',
        decodesOnDevice: false,
        encodesOnDevice: false,
        speed: null,
        softwareSpeed: 2.4,
        reason: 'No VA display found',
      }).reason,
    ).toBe('No VA display found');
  });
});
