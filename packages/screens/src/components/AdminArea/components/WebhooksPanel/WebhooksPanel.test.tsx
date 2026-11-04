import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WebhooksPanel } from './WebhooksPanel';
import type { CreatedWebhook } from '@ValenceClient/admin/fetchWebhooks';
import { aWebhook } from '@ValenceScreens/testing/aWebhook';

const draw = (overrides: Partial<Parameters<typeof WebhooksPanel>[0]> = {}) => {
  const props = {
    webhooks: [],
    accounts: [],
    profiles: [],
    created: null,
    onCreate: vi.fn().mockResolvedValue(null),
    onEdit: vi.fn().mockResolvedValue(null),
    onDismissCreated: vi.fn(),
    onSetEnabled: vi.fn(),
    onDelete: vi.fn(),
    onTest: vi.fn(),
    deliveries: [],
    openHistoryId: null,
    isHistoryLoading: false,
    onOpenHistory: vi.fn(),
    onRedeliver: vi.fn(),
    onReadAgain: vi.fn(),
    ...overrides,
  };

  render(<WebhooksPanel {...props} />);

  return props;
};

describe('WebhooksPanel', () => {
  it('says nothing is set up only once the webhooks have been read', () => {
    draw({ isReading: true });

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText(/No webhooks yet/)).not.toBeInTheDocument();
  });

  it('says the webhooks could not be read, and offers to try again, when the server fails', async () => {
    const onReadAgain = vi.fn();
    const user = userEvent.setup();

    draw({ isUnreachable: true, onReadAgain });

    expect(screen.getByText(/Couldn’t load the webhooks\./)).toBeInTheDocument();
    expect(screen.queryByText(/No webhooks yet/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(onReadAgain).toHaveBeenCalled();
  });

  it('says what this is for when nothing is set up', () => {
    draw();

    expect(screen.getByText(/No webhooks yet/)).toBeInTheDocument();
  });

  it('names each webhook, where it points and the service it posts to', () => {
    draw({ webhooks: [aWebhook({ name: 'Alerts' })] });

    const row = screen.getByRole('row', { name: /Alerts/ });

    expect(within(row).getByText('https://discord.com/api/webhooks/1/abc')).toBeInTheDocument();
    expect(within(row).getByText('Discord')).toBeInTheDocument();
  });

  it('says when one has never been used', () => {
    draw({ webhooks: [aWebhook()] });

    expect(screen.getByText('Never used')).toBeInTheDocument();
  });

  it('says one is failing when its last delivery failed', () => {
    draw({
      webhooks: [
        aWebhook({
          lastAttemptAt: '2026-08-14T20:00:00.000Z',
          lastStatus: 500,
          lastError: 'The receiving server returned 500.',
        }),
      ],
    });

    expect(screen.getByText('Failing')).toBeInTheDocument();
  });

  it('turns one off from the list', async () => {
    const user = userEvent.setup();
    const { onSetEnabled } = draw({ webhooks: [aWebhook()] });

    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    expect(onSetEnabled).toHaveBeenCalledWith(aWebhook().id, false);
  });

  it('opens a webhook onto its own page and reads its deliveries, and goes back', async () => {
    const user = userEvent.setup();
    const { onOpenHistory } = draw({ webhooks: [aWebhook({ name: 'Alerts' })] });

    await user.click(screen.getByText('Alerts'));

    expect(screen.getByRole('button', { name: 'Back to Webhooks' })).toBeInTheDocument();
    expect(onOpenHistory).toHaveBeenCalledWith(aWebhook().id);

    await user.click(screen.getByRole('button', { name: 'Back to Webhooks' }));

    expect(screen.getByRole('table', { name: 'Webhooks' })).toBeInTheDocument();
  });

  it('writes which webhook is open into the address where it is asked to', async () => {
    const onOpenWebhook = vi.fn();
    const user = userEvent.setup();

    draw({ webhooks: [aWebhook({ name: 'Alerts' })], openedWebhook: null, onOpenWebhook });
    await user.click(screen.getByText('Alerts'));

    expect(onOpenWebhook).toHaveBeenCalledWith(aWebhook().id);
  });

  it('sends a test from its page', async () => {
    const user = userEvent.setup();
    const { onTest } = draw({
      webhooks: [aWebhook()],
      openedWebhook: aWebhook().id,
      onOpenWebhook: vi.fn(),
    });

    await user.click(screen.getByRole('button', { name: 'Send a test' }));

    expect(onTest).toHaveBeenCalledWith(aWebhook().id);
  });

  it('will not offer to test one that is turned off', () => {
    draw({
      webhooks: [aWebhook({ enabled: false })],
      openedWebhook: aWebhook().id,
      onOpenWebhook: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'Send a test' })).toBeDisabled();
  });

  it('asks before deleting, says the secret goes with it, and goes back once it is gone', async () => {
    const onOpenWebhook = vi.fn();
    const user = userEvent.setup();
    const { onDelete } = draw({
      webhooks: [aWebhook()],
      openedWebhook: aWebhook().id,
      onOpenWebhook,
    });

    await user.click(screen.getByRole('button', { name: 'Actions for Discord' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    const asking = await screen.findByRole('dialog');

    expect(within(asking).getByText(/the signing secret is deleted/)).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(asking).getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(aWebhook().id);
    expect(onOpenWebhook).toHaveBeenCalledWith(null);
  });

  it('starts a new webhook from the list', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Create webhook' }));

    expect(await screen.findByRole('dialog', { name: 'Create webhook' })).toBeInTheDocument();
  });

  it('opens a webhook just made and shows its secret once', () => {
    const created: CreatedWebhook = { ...aWebhook(), secret: 'whsec_abc123' };

    draw({ webhooks: [aWebhook()], created });

    expect(screen.getByText('whsec_abc123')).toBeInTheDocument();
    expect(screen.getByText(/only time it’s shown/)).toBeInTheDocument();
  });

  it('lets somebody put the secret away once they have copied it', async () => {
    const user = userEvent.setup();
    const created: CreatedWebhook = { ...aWebhook(), secret: 'whsec_abc123' };
    const { onDismissCreated } = draw({ webhooks: [aWebhook()], created });

    await user.click(screen.getByRole('button', { name: 'I’ve copied it' }));

    expect(onDismissCreated).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhooksPanel.displayName).toBe('WebhooksPanel');
  });
});
