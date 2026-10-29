import { describe, expect, it } from 'vitest';
import { NO_TELEMETRY } from './NO_TELEMETRY';

describe('NO_TELEMETRY', () => {
  it('sends nothing and counts nothing', async () => {
    NO_TELEMETRY.notePlayback('tv', 'lounge');

    await expect(NO_TELEMETRY.send()).resolves.toBe('heldOff');
    expect(NO_TELEMETRY.isHeldOffByEnvironment).toBe(false);
  });

  it('has no report to show and no id to make', async () => {
    await expect(NO_TELEMETRY.preview()).rejects.toThrow();
    await expect(NO_TELEMETRY.resetInstallId()).rejects.toThrow();
  });
});
