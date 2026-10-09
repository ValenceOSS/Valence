import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { SEERR_DEFAULTS } from '@ValenceContracts/schemas/SeerrLink';
import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import { LINK_SETTINGS_DEFAULTS } from '@ValenceServer/linking/LinkSettings';
import { describe, expect, it } from 'vitest';
import { createMemoryJobScheduleService } from './createMemoryJobScheduleService';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { DEFAULT_JOB_TRIGGERS, jobDefinitionsFor } from './jobDefinitions';
import { seedDefaultJobTriggers } from './seedDefaultJobTriggers';
import { EVERY_APP_ALLOWED } from '@ValenceContracts/schemas/AllowedApps';
import type { ServerSettings } from '@ValenceServer/settings/ServerSettings';

const SETTINGS: ServerSettings = {
  trustedOrigins: [],
  cookieSecure: false,
  setupCompletedAt: null,
  setupFlow: 'finished',
  catalogueApiKey: '',
  hardwareAccel: '',
  previewQuality: 'high' as const,
  showsProfilesBeforeSignIn: false,
  allowedApps: EVERY_APP_ALLOWED,
  seededJobTriggerKinds: [],
  seededRoleNames: [],
  pushPublicKey: '',
  pushPrivateKey: '',
  mediaDigestReadTo: null,
  jobsTimezone: '',
  certificationRegion: 'GB',
  fetchesCatalogueTrailers: false,
  requestReleaseTypes: ['album'],
  controlsConnectedApps: false,
  fetchesMusicDetails: false,
  audioDbKey: '',
  omdbKey: '',
  ownerAccountId: '',
  splashscreenFile: null,
  reencodesAwaitingReviewCap: 5,
  roundness: 'default',
  keepsDownloadsForDays: 14,
  preTranscoding: PRE_TRANSCODING_DEFAULTS,
  seerr: SEERR_DEFAULTS,
  email: EMAIL_DEFAULTS,
  linking: LINK_SETTINGS_DEFAULTS,
};

const build = (seededJobTriggerKinds: string[] = []) => ({
  schedules: createMemoryJobScheduleService(),
  settings: createMemorySettingsStore({ ...SETTINGS, seededJobTriggerKinds }),
});

const triggersFor = async (
  schedules: ReturnType<typeof createMemoryJobScheduleService>,
  kind: string,
) => (await schedules.list()).find((entry) => entry.kind === kind)?.triggers ?? [];

describe('seedDefaultJobTriggers', () => {
  it('gives every job with a default its triggers on a fresh instance', async () => {
    const { schedules, settings } = build();

    const seeded = await seedDefaultJobTriggers({ schedules, settings });

    expect(seeded.toSorted()).toEqual(Object.keys(DEFAULT_JOB_TRIGGERS).toSorted());
    expect((await triggersFor(schedules, 'library.scan')).map((entry) => entry.trigger)).toEqual([
      { kind: 'daily', hour: 3, minute: 0 },
    ]);
  });

  it('leaves the renders to the scan that already asks for them', async () => {
    const { schedules, settings } = build();

    await seedDefaultJobTriggers({ schedules, settings });

    for (const kind of [
      'library.regeneratePreviews',
      'library.regenerateTrickplay',
      'library.detectSegments',
    ]) {
      expect(await triggersFor(schedules, kind)).toEqual([]);
    }
  });

  it('still lets an operator schedule a render on a cadence of their own', async () => {
    const { schedules, settings } = build();

    await schedules.add('library.regenerateTrickplay', { kind: 'everyHours', hours: 6 });
    await seedDefaultJobTriggers({ schedules, settings });

    expect(
      (await triggersFor(schedules, 'library.regenerateTrickplay')).map((entry) => entry.trigger),
    ).toEqual([{ kind: 'everyHours', hours: 6 }]);
  });

  it('leaves a destructive job with no schedule of its own', async () => {
    const { schedules, settings } = build();

    await seedDefaultJobTriggers({ schedules, settings });

    expect(await triggersFor(schedules, 'library.reset')).toEqual([]);
  });

  it('does not seed the same kind twice', async () => {
    const { schedules, settings } = build();

    await seedDefaultJobTriggers({ schedules, settings });

    expect(await seedDefaultJobTriggers({ schedules, settings })).toEqual([]);
    expect(await triggersFor(schedules, 'library.scan')).toHaveLength(1);
  });

  it('does not bring back a default the operator deleted', async () => {
    const { schedules, settings } = build();

    await seedDefaultJobTriggers({ schedules, settings });

    for (const entry of await triggersFor(schedules, 'library.scan')) {
      await schedules.remove('library.scan', entry.id);
    }

    await seedDefaultJobTriggers({ schedules, settings });

    expect(await triggersFor(schedules, 'library.scan')).toEqual([]);
  });

  it('leaves a kind alone when the operator already set triggers on it', async () => {
    const { schedules, settings } = build();

    await schedules.add('library.scan', { kind: 'everyHours', hours: 6 });
    await seedDefaultJobTriggers({ schedules, settings });

    expect((await triggersFor(schedules, 'library.scan')).map((entry) => entry.trigger)).toEqual([
      { kind: 'everyHours', hours: 6 },
    ]);
  });

  it('records every kind it considered, so a skipped one is not seeded later', async () => {
    const { schedules, settings } = build();

    await schedules.add('library.scan', { kind: 'everyHours', hours: 6 });
    await seedDefaultJobTriggers({ schedules, settings });

    expect((await settings.read()).seededJobTriggerKinds).toContain('library.scan');
  });

  it('seeds only the kind a later version added, leaving the rest as they are', async () => {
    const alreadyDone = Object.keys(DEFAULT_JOB_TRIGGERS).filter(
      (kind) => kind !== 'server.cleanupImageCache',
    );
    const { schedules, settings } = build(alreadyDone);

    expect(await seedDefaultJobTriggers({ schedules, settings })).toEqual([
      'server.cleanupImageCache',
    ]);
  });

  it('leaves the requests jobs unseeded while requesting is off, and seeds them once it is on', async () => {
    const settings = createMemorySettingsStore(SETTINGS);
    const off = createMemoryJobScheduleService(jobDefinitionsFor(false));

    expect(await seedDefaultJobTriggers({ schedules: off, settings })).not.toContain(
      'server.checkRequests',
    );
    expect((await settings.read()).seededJobTriggerKinds).not.toContain('server.checkRequests');

    const on = createMemoryJobScheduleService(jobDefinitionsFor(true));

    expect(await seedDefaultJobTriggers({ schedules: on, settings })).toEqual([
      'server.checkRequests',
      'requests.refreshCatalogue',
    ]);
  });
});
