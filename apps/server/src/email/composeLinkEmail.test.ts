import { describe, expect, it } from 'vitest';
import { composeLinkEmail } from './composeLinkEmail';

const LINK = {
  name: 'Ada',
  url: 'https://valence.example/setup/abc',
  expiresAt: new Date('2026-10-09T14:05:00Z'),
  server: 'Home',
};

describe('composeLinkEmail', () => {
  it('says who made the account, what the link does and when it stops working', () => {
    const email = composeLinkEmail('setupLink', LINK, 'UTC');

    expect(email.subject).toBe('Your account on Home');
    expect(email.heading).toBe('Welcome, Ada');
    expect(email.paragraphs.join(' ')).toContain('Home has created an account for you');
    expect(email.action).toEqual({ label: 'Set up your account', url: LINK.url });
    expect(email.afterAction).toEqual(['The link works once, until 9 October 2026 at 14:05 UTC.']);
  });

  it('words a password reset, and what to do if it was not asked for', () => {
    const email = composeLinkEmail('passwordReset', LINK, 'UTC');

    expect(email.subject).toBe('Reset your password on Home');
    expect(email.action?.label).toBe('Choose a new password');
    expect(email.afterAction.join(' ')).toContain('If you didn’t ask for this');
  });
});
