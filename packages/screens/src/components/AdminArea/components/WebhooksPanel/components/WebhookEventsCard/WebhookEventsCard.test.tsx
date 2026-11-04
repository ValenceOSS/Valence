import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WEBHOOK_EVENT_GROUPS } from '@ValenceContracts/schemas/Webhook';
import { WebhookEventsCard } from './WebhookEventsCard';
import type { WebhookSubscribableEvent } from '@ValenceContracts/schemas/Webhook';

const OFFERED: readonly WebhookSubscribableEvent[] = WEBHOOK_EVENT_GROUPS.flatMap(
  (group) => group.events,
);

const drawn = (events: WebhookSubscribableEvent[], hasRequests = true) => {
  const onChange = vi.fn<(next: WebhookSubscribableEvent[]) => void>();

  render(
    <WebhookEventsCard
      events={events}
      offered={OFFERED}
      hasRequests={hasRequests}
      onChange={onChange}
    />,
  );

  return onChange;
};

describe('WebhookEventsCard', () => {
  it('sends only problems from the quick start, with each one’s recovery', async () => {
    const user = userEvent.setup();
    const onChange = drawn(['media.added']);

    await user.click(screen.getByRole('button', { name: 'Problems only' }));

    const sent = onChange.mock.lastCall?.[0] ?? [];

    expect(sent).toEqual(expect.arrayContaining(['job.failed', 'disk.low', 'disk.recovered']));
    expect(sent).not.toContain('media.added');
  });

  it('says which quick start matches what it sends', () => {
    drawn(['media.added']);

    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('turns a failure on together with saying when it is fixed', async () => {
    const user = userEvent.setup();
    const onChange = drawn(['job.failed']);

    await user.click(screen.getByRole('switch', { name: 'A job keeps failing' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining(['job.failed', 'job.stalled', 'job.working']),
    );
  });

  it('stops saying when things are fixed once that is turned off', async () => {
    const user = userEvent.setup();
    const onChange = drawn(['job.failed', 'job.stalled', 'job.working']);

    await user.click(screen.getByRole('switch', { name: 'Also say when it’s fixed' }));

    expect(onChange).toHaveBeenCalledWith(['job.failed', 'job.stalled']);
  });

  it('never leaves a webhook sending nothing', async () => {
    const user = userEvent.setup();
    const onChange = drawn(['job.failed']);

    await user.click(screen.getByRole('switch', { name: 'Job failed' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('turns a whole group on at once', async () => {
    const user = userEvent.setup();
    const onChange = drawn(['job.failed']);

    await user.click(screen.getAllByRole('button', { name: 'Turn all on' })[0] ?? document.body);

    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['job.completed', 'job.failed']));
  });

  it('leaves out requests where requesting is off', () => {
    drawn(['job.failed'], false);

    expect(screen.queryByRole('button', { name: 'Problems and requests' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Requests/u })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhookEventsCard.displayName).toBe('WebhookEventsCard');
  });
});
