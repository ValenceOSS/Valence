import { describe, expect, it } from 'vitest';
import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import { describeEmailSetup } from './describeEmailSetup';

const SAVED = {
  ...EMAIL_DEFAULTS,
  isEnabled: true,
  host: 'smtp.example.com',
  username: 'me',
  password: 'secret',
  fromAddress: 'valence@example.com',
  sendsSetupLinks: true,
};

describe('describeEmailSetup', () => {
  it('says whether a password is set but never says it', () => {
    const setup = describeEmailSetup(SAVED, { smtpUrl: '', smtpFrom: '' }, []);

    expect(setup).toMatchObject({
      isEnabled: true,
      host: 'smtp.example.com',
      hasPassword: true,
      sendsSetupLinks: true,
      isFromEnvironment: false,
      recent: [],
    });
    expect(JSON.stringify(setup)).not.toContain('secret');
  });

  it('shows the environment server when it decides, on, keeping the saved switches', () => {
    const setup = describeEmailSetup(
      { ...SAVED, isEnabled: false },
      { smtpUrl: 'smtps://resend:topsecret@smtp.resend.com', smtpFrom: 'v@example.org' },
      [],
    );

    expect(setup).toMatchObject({
      isEnabled: true,
      host: 'smtp.resend.com',
      username: 'resend',
      hasPassword: true,
      fromAddress: 'v@example.org',
      sendsSetupLinks: true,
      isFromEnvironment: true,
    });
    expect(JSON.stringify(setup)).not.toContain('topsecret');
  });
});
