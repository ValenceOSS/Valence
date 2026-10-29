import { describe, expect, it } from 'vitest';
import { isTelemetryHeldOff } from './isTelemetryHeldOff';

describe('isTelemetryHeldOff', () => {
  it('leaves sending to the settings when neither variable is set', () => {
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: '', DO_NOT_TRACK: '', NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('holds off when Valence is told to, in any of the usual words', () => {
    for (const word of ['off', 'OFF', ' false ', '0', 'no', 'disabled']) {
      expect(
        isTelemetryHeldOff({ VALENCE_TELEMETRY: word, DO_NOT_TRACK: '', NODE_ENV: 'production' }),
      ).toBe(true);
    }
  });

  it('holds off when do not track is set', () => {
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: '', DO_NOT_TRACK: '1', NODE_ENV: 'production' }),
    ).toBe(true);
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: 'on', DO_NOT_TRACK: 'true', NODE_ENV: 'production' }),
    ).toBe(true);
  });

  it('does not hold off for a do not track that says no', () => {
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: 'on', DO_NOT_TRACK: '0', NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('holds off in a development build unless told to send', () => {
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: '', DO_NOT_TRACK: '', NODE_ENV: 'development' }),
    ).toBe(true);
    expect(
      isTelemetryHeldOff({ VALENCE_TELEMETRY: 'on', DO_NOT_TRACK: '', NODE_ENV: 'development' }),
    ).toBe(false);
  });
});
