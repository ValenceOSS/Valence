import { describe, expect, it } from 'vitest';
import {
  SEERR_DEFAULTS,
  SEERR_RADARR_PATH,
  SEERR_SONARR_PATH,
  SeerrLinkChangeSchema,
} from './SeerrLink';

describe('SeerrSettingsSchema', () => {
  it('starts off, with no key and nobody to ask as', () => {
    expect(SEERR_DEFAULTS).toEqual({ isEnabled: false, apiKey: '', accountId: '' });
  });

  it('answers as Radarr and as Sonarr under two different bases', () => {
    expect(SEERR_RADARR_PATH).not.toBe(SEERR_SONARR_PATH);
  });
});

describe('SeerrLinkChangeSchema', () => {
  it('takes whether it is on and who asks', () => {
    expect(SeerrLinkChangeSchema.parse({ isEnabled: true, accountId: 'a1' })).toEqual({
      isEnabled: true,
      accountId: 'a1',
    });
  });

  it('refuses a change that does not say whether it is on', () => {
    expect(SeerrLinkChangeSchema.safeParse({ accountId: 'a1' }).success).toBe(false);
  });
});
