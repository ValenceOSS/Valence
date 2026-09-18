import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { DEFAULT_WEBHOOK_FILTERS } from '@ValenceContracts/schemas/Webhook';
import { WebhookFields } from './WebhookFields';
import { WEBHOOK_PANES, WEBHOOK_PANE_ITEMS, isWebhookPane } from './webhookPanes';
import type { WebhookDraft, WebhookFieldsProps } from './WebhookFields.types';

const aDraft = (overrides: Partial<WebhookDraft> = {}): WebhookDraft => ({
  name: 'Discord',
  url: 'https://discord.com/api/webhooks/1/abc',
  preset: 'discord',
  events: ['job.failed'],
  filters: DEFAULT_WEBHOOK_FILTERS,
  ...overrides,
});

/**
 * Stands in for the `Tabs` and `TabRow` a real caller wraps `WebhookFields` in, since the panes are
 * bare `TabPanel`s that need a `Tabs` provider above them and a way to move between them.
 */
const Harness = (props: Omit<WebhookFieldsProps, 'travel'>) => {
  const [pane, setPane] = useState<(typeof WEBHOOK_PANES)[number]>('where');
  const travel = useTravelDirection([...WEBHOOK_PANES], pane);

  return (
    <Tabs
      value={pane}
      onValueChange={(next) => {
        if (isWebhookPane(next)) {
          setPane(next);
        }
      }}
    >
      <TabRow
        label="What to change"
        tone="underlined"
        size="sm"
        value={pane}
        groups={[{ items: WEBHOOK_PANE_ITEMS }]}
      />

      <WebhookFields {...props} travel={travel} />
    </Tabs>
  );
};

const draw = (overrides: Partial<Omit<WebhookFieldsProps, 'travel'>> = {}) => {
  const onChange = vi.fn<(draft: WebhookDraft) => void>();
  const props: Omit<WebhookFieldsProps, 'travel'> = {
    draft: aDraft(),
    onChange,
    accounts: [
      { id: 'account-1', label: 'Ada' },
      { id: 'account-2', label: 'Grace' },
    ],
    profiles: [
      { id: 'profile-1', label: 'Ada' },
      { id: 'profile-2', label: 'Grace' },
    ],
    ...overrides,
  };

  render(<Harness {...props} />);

  return { ...props, onChange };
};

const openPane = async (user: ReturnType<typeof userEvent.setup>, pane: string) => {
  await user.click(screen.getByRole('tab', { name: pane }));
};

const changedTo = (onChange: ReturnType<typeof draw>['onChange']): WebhookDraft => {
  const asked = onChange.mock.calls[0]?.[0];

  if (asked === undefined) {
    throw new Error('Nothing changed.');
  }

  return asked;
};

describe('WebhookFields', () => {
  it('opens on where deliveries go, which is what a new subscription needs first', () => {
    draw();

    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Discord');
  });

  it('shows which events the draft asks for, under Events', async () => {
    const user = userEvent.setup();

    draw();
    await openPane(user, 'Events');

    expect(screen.getByRole('switch', { name: 'Job failed' })).toBeChecked();
  });

  it('adds an event without disturbing the one already chosen', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await openPane(user, 'Events');
    await user.click(screen.getByRole('switch', { name: 'Signed in' }));

    expect(changedTo(onChange).events).toStrictEqual(['job.failed', 'auth.succeeded']);
  });

  it('takes an event back off', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await openPane(user, 'Events');
    await user.click(screen.getByRole('switch', { name: 'Job failed' }));

    expect(changedTo(onChange).events).toStrictEqual([]);
  });

  it('changes the shape deliveries take', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await user.click(screen.getByRole('button', { name: /ntfy/ }));

    expect(changedTo(onChange).preset).toBe('ntfy');
  });

  it('asks for arrivals one at a time', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await openPane(user, 'Who');
    await user.click(screen.getByRole('button', { name: 'One for each thing' }));

    expect(changedTo(onChange).filters.mediaAdded).toBe('perItem');
  });

  it('tells accounts and profiles apart even where somebody is named in both', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await openPane(user, 'Who');

    await user.click(
      within(screen.getByRole('group', { name: 'Which accounts' })).getByRole('button', {
        name: 'Only these',
      }),
    );

    const accounts = within(screen.getByRole('group', { name: 'Accounts' }));

    await user.click(accounts.getByRole('switch', { name: 'Ada' }));

    expect(changedTo(onChange).filters).toMatchObject({ accounts: ['account-1'], profiles: [] });
  });

  it('groups events, so twenty-one of them are not one wall', async () => {
    const user = userEvent.setup();

    draw();
    await openPane(user, 'Events');

    expect(screen.getByRole('group', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Watching' })).toBeInTheDocument();
  });

  it('takes a whole group at once, which is what trying a different set of hooks means', async () => {
    const user = userEvent.setup();
    const { onChange } = draw();

    await openPane(user, 'Events');

    const watching = screen.getByRole('group', { name: 'Watching' });
    const takeAll = within(watching.parentElement ?? watching).getByRole('button', { name: 'All' });

    await user.click(takeAll);

    expect(changedTo(onChange).events).toStrictEqual([
      'job.failed',
      'playback.started',
      'playback.stopped',
    ]);
  });

  it('says the thing a label should not carry beneath it instead', async () => {
    const user = userEvent.setup();

    draw();
    await openPane(user, 'Events');

    expect(screen.getByRole('switch', { name: 'Sign-in refused' })).toHaveAccessibleDescription(
      /Rate-limited attempts are refused/,
    );
  });
});
