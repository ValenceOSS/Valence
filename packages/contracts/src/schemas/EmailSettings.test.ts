import { describe, expect, it } from 'vitest';
import { EMAIL_DEFAULTS, EmailSettingsSchema } from './EmailSettings';

describe('EmailSettingsSchema', () => {
  it('starts off, sending nothing, with no server and no password', () => {
    expect(EMAIL_DEFAULTS).toEqual({
      isEnabled: false,
      host: '',
      port: 587,
      security: 'starttls',
      username: '',
      password: '',
      fromName: '',
      fromAddress: '',
      sendsPasswordResets: false,
      sendsSetupLinks: false,
    });
  });

  it('refuses a port no server listens on', () => {
    expect(EmailSettingsSchema.safeParse({ port: 70_000 }).success).toBe(false);
  });

  it('refuses a security it does not know', () => {
    expect(EmailSettingsSchema.safeParse({ security: 'ssl' }).success).toBe(false);
  });
});
