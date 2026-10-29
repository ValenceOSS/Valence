import { describe, expect, it } from 'vitest';
import { ServerSettingsSchema } from './ServerSettings';

const STORED = { trustedOrigins: [], cookieSecure: false, setupCompletedAt: null };

describe('ServerSettingsSchema', () => {
  it('reads a server set up before the steps after setup existed as having finished them', () => {
    expect(ServerSettingsSchema.parse(STORED).setupFlow).toBe('finished');
  });

  it('keeps the steps open while the administrator is still going through them', () => {
    expect(ServerSettingsSchema.parse({ ...STORED, setupFlow: 'open' }).setupFlow).toBe('open');
  });

  it('shares no anonymous statistics until told to, with no install id until one is made', () => {
    const read = ServerSettingsSchema.parse(STORED);

    expect(read.telemetryEnabled).toBe(false);
    expect(read.telemetryInstallId).toBe('');
  });

  it('keeps only a random install id', () => {
    expect(
      ServerSettingsSchema.safeParse({
        ...STORED,
        telemetryInstallId: '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41',
      }).success,
    ).toBe(true);
    expect(ServerSettingsSchema.safeParse({ ...STORED, telemetryInstallId: 'home' }).success).toBe(
      false,
    );
  });

  it('refuses a step state it does not know', () => {
    expect(ServerSettingsSchema.safeParse({ ...STORED, setupFlow: 'half' }).success).toBe(false);
  });
});
