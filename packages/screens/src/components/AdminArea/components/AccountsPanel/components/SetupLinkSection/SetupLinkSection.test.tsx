import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { issueSetupLink } from '@ValenceClient/admin/issueSetupLink';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { revokeSetupLink } from '@ValenceClient/admin/revokeSetupLink';
import { AccountSchema } from '@ValenceContracts/schemas/Account';
import { SetupLinkSection } from './SetupLinkSection';

vi.mock('@ValenceClient/admin/issueSetupLink', () => ({ issueSetupLink: vi.fn() }));
vi.mock('@ValenceClient/admin/emailSetupLink', () => ({ emailSetupLink: vi.fn() }));
vi.mock('@ValenceClient/admin/revokeSetupLink', () => ({ revokeSetupLink: vi.fn() }));

const LINK = { url: 'https://valence.example/welcome/abc', expiresAt: '2026-10-09T00:00:00.000Z' };

const account = (changes: object = {}) =>
  AccountSchema.parse({
    id: 'usr-1',
    name: 'Ada',
    username: 'ada',
    email: 'ada@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    isBanned: false,
    banReason: null,
    position: null,
    isAdministrator: false,
    face: null,
    roles: [],
    canSignIn: false,
    setup: { state: 'waiting', expiresAt: LINK.expiresAt },
    ...changes,
  });

/**
 * Draws the section, with what it tells its caller standing in.
 *
 * @param props - The account, any link held, and whether email is on.
 * @returns What it tells its caller.
 */
const draw = (props: {
  account: ReturnType<typeof account>;
  held?: typeof LINK | null;
  canEmail?: boolean;
}) => {
  const told = { onHeld: vi.fn(), onChanged: vi.fn().mockResolvedValue(undefined) };

  render(
    <SetupLinkSection
      account={props.account}
      held={props.held ?? null}
      canEmail={props.canEmail ?? false}
      {...told}
    />,
  );

  return told;
};

beforeEach(() => {
  vi.mocked(issueSetupLink).mockReset();
  vi.mocked(emailSetupLink).mockReset();
  vi.mocked(revokeSetupLink).mockReset();
});

describe('SetupLinkSection', () => {
  it('says an account is waiting, and that its link is not kept', () => {
    draw({ account: account() });

    expect(screen.getByText(/Waiting for Ada to set up/)).toBeInTheDocument();
    expect(screen.getByText(/keeps no copy/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New link/ })).toBeInTheDocument();
  });

  it('makes a new link for as long as chosen, and holds it to show', async () => {
    vi.mocked(issueSetupLink).mockResolvedValue({ kind: 'answered', value: LINK });

    const told = draw({ account: account() });

    await userEvent.click(screen.getByRole('button', { name: '1 day' }));
    await userEvent.click(screen.getByRole('button', { name: /New link/ }));

    expect(issueSetupLink).toHaveBeenCalledWith('usr-1', 1);
    expect(told.onHeld).toHaveBeenCalledWith(LINK);
    expect(told.onChanged).toHaveBeenCalled();
  });

  it('shows the link it holds to hand over', () => {
    draw({ account: account(), held: LINK });

    expect(screen.getByText(LINK.url)).toBeInTheDocument();
  });

  it('offers an account in use a link to choose a new password', () => {
    draw({ account: account({ canSignIn: true, setup: { state: 'none', expiresAt: null } }) });

    expect(screen.getByText(/choose a new password or a passkey/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make a setup link/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revoke link' })).not.toBeInTheDocument();
  });

  it('emails a new link where there is none on screen', async () => {
    vi.mocked(emailSetupLink).mockResolvedValue({ kind: 'answered', value: LINK });

    draw({ account: account(), canEmail: true });

    await userEvent.click(screen.getByRole('button', { name: /Send by email/ }));

    expect(emailSetupLink).toHaveBeenCalledWith('usr-1', { lifetimeDays: 7 });
  });

  it('does not offer email to an account without an address', () => {
    draw({ account: account({ email: null }), canEmail: true });

    expect(screen.queryByRole('button', { name: /Send by email/ })).not.toBeInTheDocument();
  });

  it('revokes the link once asked to', async () => {
    vi.mocked(revokeSetupLink).mockResolvedValue(null);

    const told = draw({ account: account(), held: LINK });

    await userEvent.click(screen.getByRole('button', { name: 'Revoke link' }));

    const confirming = await screen.findByRole('dialog');

    await userEvent.click(within(confirming).getByRole('button', { name: 'Revoke link' }));

    expect(revokeSetupLink).toHaveBeenCalledWith('usr-1');
    expect(told.onHeld).toHaveBeenCalledWith(null);
  });
});
