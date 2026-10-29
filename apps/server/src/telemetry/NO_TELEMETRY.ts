import type { TelemetryService } from './TelemetryService';

const NO_TELEMETRY: TelemetryService = {
  isHeldOffByEnvironment: false,
  preview: () => Promise.reject(new Error('telemetry is not wired into this server')),
  send: () => Promise.resolve('heldOff'),
  resetInstallId: () => Promise.reject(new Error('telemetry is not wired into this server')),
  notePlayback: () => undefined,
};

export { NO_TELEMETRY };
