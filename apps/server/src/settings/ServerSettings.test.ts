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

  it('refuses a step state it does not know', () => {
    expect(ServerSettingsSchema.safeParse({ ...STORED, setupFlow: 'half' }).success).toBe(false);
  });
});
