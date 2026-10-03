import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { EmailCard } from './EmailCard';
import type {
  EmailSetup,
  EmailSetupChange,
  EmailTestResult,
} from '@ValenceContracts/schemas/EmailSetup';

const fetchEmailSetup = vi.fn<() => Promise<EmailSetup>>();
const saveEmailSetup = vi.fn<(change: EmailSetupChange) => Promise<EmailSetup | null>>();
const sendTestEmail = vi.fn<(to: string) => Promise<EmailTestResult | null>>();

vi.mock('@ValenceClient/admin/fetchEmailSetup', () => ({
  fetchEmailSetup: () => fetchEmailSetup(),
}));

vi.mock('@ValenceClient/admin/saveEmailSetup', () => ({
  saveEmailSetup: (change: EmailSetupChange) => saveEmailSetup(change),
}));

vi.mock('@ValenceClient/admin/sendTestEmail', () => ({
  sendTestEmail: (to: string) => sendTestEmail(to),
}));

const SETUP: EmailSetup = {
  isEnabled: false,
  host: 'smtp.example.com',
  port: 587,
  security: 'starttls',
  username: 'me',
  hasPassword: true,
  fromName: 'Home',
  fromAddress: 'valence@example.com',
  sendsPasswordResets: false,
  sendsSetupLinks: false,
  isFromEnvironment: false,
  recent: [],
};

beforeEach(() => {
  fetchEmailSetup.mockReset().mockResolvedValue(SETUP);
  saveEmailSetup
    .mockReset()
    .mockImplementation((change) => Promise.resolve({ ...SETUP, ...change, hasPassword: true }));
  sendTestEmail.mockReset().mockResolvedValue({ sent: true, problem: null });
});

describe('EmailCard', () => {
  it('says plainly what leaves the server, and links to how to set it up', async () => {
    renderInAnAddress(<EmailCard />);

    expect(
      await screen.findByText(/the addresses Valence sends to and everything each email says go/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How to set up email' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/use/email',
    );
  });

  it('fills in Resend with one press, keeping the saved password unless a new one is typed', async () => {
    renderInAnAddress(<EmailCard />);

    await userEvent.click(await screen.findByRole('button', { name: /Use Resend/ }));
    await userEvent.click(screen.getByRole('switch', { name: 'Send email' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveEmailSetup).toHaveBeenCalledWith({
        isEnabled: true,
        host: 'smtp.resend.com',
        port: 465,
        security: 'tls',
        username: 'resend',
        password: '',
        fromName: 'Home',
        fromAddress: 'valence@example.com',
        sendsPasswordResets: false,
        sendsSetupLinks: false,
      });
    });
  });

  it('turns on what is emailed', async () => {
    renderInAnAddress(<EmailCard />);

    await userEvent.click(
      await screen.findByRole('switch', { name: 'Email password reset links' }),
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Email setup links' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveEmailSetup).toHaveBeenCalledWith(
        expect.objectContaining({ sendsPasswordResets: true, sendsSetupLinks: true }),
      );
    });
  });

  it('sends a test and says it went, or why not', async () => {
    sendTestEmail.mockResolvedValueOnce({ sent: true, problem: null }).mockResolvedValueOnce({
      sent: false,
      problem: {
        code: 'server.email.describeSendFailure.theMailServerRefusedTheSignIn',
        message: 'The mail server at smtp.example.com refused the username or password.',
        values: { host: 'smtp.example.com' },
      },
    });
    renderInAnAddress(<EmailCard />);

    await userEvent.type(await screen.findByLabelText('Send a test to'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send test email' }));

    expect(
      await screen.findByText('Sent. Check the inbox of ada@example.com.'),
    ).toBeInTheDocument();
    expect(sendTestEmail).toHaveBeenCalledWith('ada@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'Send test email' }));

    expect(
      await screen.findByText(
        'The mail server at smtp.example.com refused the username or password.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the recent emails, with the reason any failed', async () => {
    fetchEmailSetup.mockResolvedValue({
      ...SETUP,
      recent: [
        {
          id: '1',
          kind: 'setupLink',
          recipient: 'ada@example.com',
          state: 'failed',
          failure: { code: null, message: '550 Domain not verified', values: {} },
          createdAt: new Date().toISOString(),
        },
      ],
    });
    renderInAnAddress(<EmailCard />);

    expect(await screen.findByText('Failed: 550 Domain not verified')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('says the environment decides the server when SMTP_URL is set, and locks it', async () => {
    fetchEmailSetup.mockResolvedValue({ ...SETUP, isEnabled: true, isFromEnvironment: true });
    renderInAnAddress(<EmailCard />);

    expect(await screen.findByText('Set by the environment')).toBeInTheDocument();
    expect(screen.getByText('Mail server')).toBeInTheDocument();
    expect(screen.getByLabelText('Server address')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Use Resend/ })).not.toBeInTheDocument();
  });

  it('says when the settings could not be read', async () => {
    fetchEmailSetup.mockRejectedValue(new Error('offline'));
    renderInAnAddress(<EmailCard />);

    expect(await screen.findByText(/The email settings could not be read\./)).toBeInTheDocument();
  });
});
