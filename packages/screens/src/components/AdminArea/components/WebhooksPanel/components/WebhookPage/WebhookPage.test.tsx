import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { WebhookPage } from './WebhookPage';
import type { WebhookDelivery, WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import { aWebhook as aWebhookFixture } from '@ValenceScreens/testing/aWebhook';

const aWebhook = (overrides: Partial<WebhookSubscription> = {}): WebhookSubscription =>
  aWebhookFixture({ name: 'Alerts', url: 'https://hooks.example/alerts', ...overrides });

const FAILED: WebhookDelivery = {
  id: '9a1b2c3d-0000-4000-8000-000000000001',
  subscriptionId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  event: 'job.failed',
  attempts: 3,
  firstAttemptAt: '2026-08-14T20:00:00.000Z',
  lastAttemptAt: '2026-08-14T20:05:00.000Z',
  ok: false,
  status: 500,
  error: 'The receiver answered 500.',
};

const drawn = (
  webhook: WebhookSubscription,
  change: Partial<Parameters<typeof WebhookPage>[0]> = {},
) => {
  const props = {
    webhook,
    created: null,
    deliveries: [],
    isHistoryLoading: false,
    accounts: [],
    profiles: [],
    hasRequests: false,
    onBack: vi.fn(),
    onEdit: vi.fn().mockResolvedValue(null),
    onSetEnabled: vi.fn(),
    onTest: vi.fn(),
    onDelete: vi.fn(),
    onRedeliver: vi.fn(),
    onDismissCreated: vi.fn(),
    ...change,
  };

  render(<WebhookPage {...props} />);

  return props;
};

describe('WebhookPage', () => {
  it('says what the webhook is, where it posts and how its last delivery went', () => {
    drawn(aWebhook());

    expect(screen.getByText('https://hooks.example/alerts')).toBeInTheDocument();
    expect(screen.getByText('Never used')).toBeInTheDocument();
  });

  it('shows the Custom service’s headers and message only for a Custom webhook', () => {
    drawn(aWebhook());

    expect(screen.queryByText('Headers')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Template' })).not.toBeInTheDocument();
  });

  it('draws a Custom webhook’s request, headers and message from its saved setup', () => {
    drawn(
      aWebhook({
        preset: 'custom',
        custom: { ...DEFAULT_CUSTOM_WEBHOOK, method: 'PUT' },
      }),
    );

    expect(screen.getByRole('button', { name: 'PUT' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Template' })).toHaveValue(
      DEFAULT_CUSTOM_WEBHOOK.template,
    );
  });

  it('starts a webhook turned Custom with the default setup', async () => {
    const user = userEvent.setup();
    const { onEdit } = drawn(aWebhook());

    await user.click(screen.getByRole('button', { name: 'Service' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Custom' }));

    expect(onEdit).toHaveBeenCalledWith(aWebhook().id, {
      preset: 'custom',
      custom: DEFAULT_CUSTOM_WEBHOOK,
    });
  });

  it('turns the local network on and off for the webhook', async () => {
    const user = userEvent.setup();
    const { onEdit } = drawn(aWebhook());

    await user.click(screen.getByRole('switch', { name: 'Local network' }));

    expect(onEdit).toHaveBeenCalledWith(aWebhook().id, { reachesLocalNetwork: true });
  });

  it('keeps a Custom setup already saved when turned back to Custom', async () => {
    const user = userEvent.setup();
    const { onEdit } = drawn(aWebhook({ custom: DEFAULT_CUSTOM_WEBHOOK }));

    await user.click(screen.getByRole('button', { name: 'Service' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Custom' }));

    expect(onEdit).toHaveBeenCalledWith(aWebhook().id, { preset: 'custom' });
  });

  it('saves the Custom message with the rest of its setup', async () => {
    const user = userEvent.setup();
    const custom = { ...DEFAULT_CUSTOM_WEBHOOK, format: 'text' as const, template: '{{title}}' };
    const { onEdit } = drawn(aWebhook({ preset: 'custom', custom }));

    await user.type(screen.getByRole('textbox', { name: 'Template' }), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEdit).toHaveBeenCalledWith(aWebhook().id, {
      custom: { ...custom, template: '{{title}}!' },
    });
  });

  it('says under the address what is wrong with a new one rather than saving it', async () => {
    const user = userEvent.setup();
    const { onEdit } = drawn(aWebhook());

    await user.clear(screen.getByRole('textbox', { name: 'Address' }));
    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'hooks');

    expect(screen.getByText(/isn’t a web address/u)).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('sends a failed delivery again', async () => {
    const user = userEvent.setup();
    const { onRedeliver } = drawn(aWebhook(), { deliveries: [FAILED] });

    expect(screen.getByText('The receiver answered 500.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resend' }));

    expect(onRedeliver).toHaveBeenCalledWith(FAILED.id);
  });

  it('goes back to every webhook', async () => {
    const user = userEvent.setup();
    const { onBack } = drawn(aWebhook());

    await user.click(screen.getByRole('button', { name: 'Back to Webhooks' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhookPage.displayName).toBe('WebhookPage');
  });
});
