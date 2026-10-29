import { describe, expect, it, vi } from 'vitest';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { TelemetryReportSchema } from '@ValenceContracts/schemas/TelemetryReport';
import { TranscodeDeviceSchema } from '@ValenceContracts/schemas/TranscodeDevice';
import { createTelemetryService } from './createTelemetryService';
import { createPlaybackTally } from './createPlaybackTally';
import type { sendTelemetryReport } from './sendTelemetryReport';

const ID = '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41';

const ANOTHER_ID = '0f9e8d7c-6b5a-4c3d-8e1f-a2b3c4d5e6f7';

const ADDRESS = 'https://metrics.getvalence.app/api/v1/reports';

const HOST = {
  installMethod: () => 'docker' as const,
  os: () => ({ platform: 'linux', release: '6.8.0', arch: 'x64' }),
  cores: () => [{ model: 'AMD Ryzen 7 9800X3D' }, { model: 'AMD Ryzen 7 9800X3D' }],
  totalMemoryBytes: () => 16 * 1024 ** 3,
};

/**
 * A telemetry service over settings in memory and a media service that answers, with the sending
 * watched.
 *
 * @param changes - What differs from a server set up and sharing its statistics.
 * @returns The service, its settings, what it sent, and its tally of players.
 */
const build = (
  changes: {
    isHeldOffByEnvironment?: boolean;
    telemetryEnabled?: boolean;
    telemetryInstallId?: string;
    setupCompletedAt?: string | null;
    listDevices?: () => Promise<ReturnType<typeof TranscodeDeviceSchema.parse>[]>;
    sent?: Awaited<ReturnType<typeof sendTelemetryReport>>;
  } = {},
) => {
  const settings = createMemorySettingsStore(
    ServerSettingsSchema.parse({
      trustedOrigins: [],
      cookieSecure: false,
      setupCompletedAt:
        changes.setupCompletedAt === undefined
          ? '2026-10-01T00:00:00.000Z'
          : changes.setupCompletedAt,
      telemetryEnabled: changes.telemetryEnabled ?? true,
      telemetryInstallId: changes.telemetryInstallId ?? '',
    }),
  );
  const send = vi.fn<typeof sendTelemetryReport>(() =>
    Promise.resolve(changes.sent ?? { isSent: true }),
  );
  const tally = createPlaybackTally();
  const log = vi.fn<(line: string) => void>();
  const ids = [ID, ANOTHER_ID];
  const telemetry = createTelemetryService({
    settings,
    isHeldOffByEnvironment: changes.isHeldOffByEnvironment ?? false,
    address: ADDRESS,
    version: '1.8.0',
    host: HOST,
    listDevices:
      changes.listDevices ??
      (() =>
        Promise.resolve([
          TranscodeDeviceSchema.parse({ id: 'gpu0', name: 'GeForce RTX 5080', vendor: 'nvidia' }),
        ])),
    provedAccels: () => Promise.resolve(['nvenc']),
    database: () => Promise.resolve('postgres'),
    library: () => Promise.resolve({ films: 12, episodes: 0, tracks: 0, books: 0 }),
    tally,
    send,
    newId: () => ids.shift() ?? ANOTHER_ID,
    log,
  });

  return { telemetry, settings, send, tally, log };
};

describe('createTelemetryService', () => {
  it('previews the report it would send, which its own schema reads', async () => {
    const { telemetry } = build();

    const preview = await telemetry.preview();

    expect(preview).toMatchObject({ isSending: true, heldOffBy: null, address: ADDRESS });
    expect(TelemetryReportSchema.parse(preview.report)).toEqual(preview.report);
    expect(preview.report).toMatchObject({
      installId: ID,
      version: '1.8.0',
      cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 2 },
      gpus: [{ vendor: 'nvidia', model: 'GeForce RTX 5080' }],
      accels: ['nvenc'],
      library: { films: '10-99' },
    });
  });

  it('makes the install id once and keeps it in the settings', async () => {
    const { telemetry, settings } = build();

    await telemetry.preview();
    await telemetry.preview();

    expect((await settings.read()).telemetryInstallId).toBe(ID);
    expect((await telemetry.preview()).report.installId).toBe(ID);
  });

  it('uses the install id already kept', async () => {
    const { telemetry } = build({ telemetryInstallId: ANOTHER_ID });

    expect((await telemetry.preview()).report.installId).toBe(ANOTHER_ID);
  });

  it('makes a new install id when asked', async () => {
    const { telemetry, settings } = build({ telemetryInstallId: ANOTHER_ID });

    await expect(telemetry.resetInstallId()).resolves.toBe(ID);
    expect((await settings.read()).telemetryInstallId).toBe(ID);
    expect((await telemetry.preview()).report.installId).toBe(ID);
  });

  it('sends the report and counts the players again afterwards', async () => {
    const { telemetry, send, tally } = build();

    telemetry.notePlayback('tv', 'lounge');

    await expect(telemetry.send()).resolves.toBe('sent');
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      address: ADDRESS,
      version: '1.8.0',
      report: { clients: { tv: '1-9' } },
    });
    expect(tally.read().tv).toBe(0);
  });

  it('sends nothing when the environment forbids it, whatever the settings say', async () => {
    const { telemetry, send } = build({ isHeldOffByEnvironment: true });

    await expect(telemetry.send()).resolves.toBe('heldOff');
    expect(send).not.toHaveBeenCalled();
    expect((await telemetry.preview()).heldOffBy).toBe('environment');
  });

  it('sends nothing when the setting is off', async () => {
    const { telemetry, send } = build({ telemetryEnabled: false });

    await expect(telemetry.send()).resolves.toBe('heldOff');
    expect(send).not.toHaveBeenCalled();
    expect(await telemetry.preview()).toMatchObject({ isSending: false, heldOffBy: 'setting' });
  });

  it('sends nothing before setup is finished', async () => {
    const { telemetry, send } = build({ setupCompletedAt: null });

    await expect(telemetry.send()).resolves.toBe('heldOff');
    expect(send).not.toHaveBeenCalled();
    expect((await telemetry.preview()).heldOffBy).toBe('setup');
  });

  it('says a report that did not arrive in the log and moves on', async () => {
    const { telemetry, log } = build({ sent: { isSent: false, problem: '503' } });

    await expect(telemetry.send()).resolves.toBe('failed');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('503'));
  });

  it('leaves the graphics out where the media service cannot be reached', async () => {
    const { telemetry } = build({ listDevices: () => Promise.reject(new Error('unreachable')) });

    expect((await telemetry.preview()).report.gpus).toEqual([]);
  });

  it('says whether the environment forbids sending', () => {
    expect(build({ isHeldOffByEnvironment: true }).telemetry.isHeldOffByEnvironment).toBe(true);
    expect(build().telemetry.isHeldOffByEnvironment).toBe(false);
  });
});
