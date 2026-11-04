import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { CustomMessageCard } from './CustomMessageCard';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const drawn = (setup: CustomWebhook = DEFAULT_CUSTOM_WEBHOOK) => {
  const onSave = vi.fn().mockResolvedValue(true);

  render(
    <CustomMessageCard
      setup={setup}
      subscribed={['job.failed']}
      url="https://hooks.example/valence"
      onSave={onSave}
    />,
  );

  return onSave;
};

const template = () => screen.getByRole('textbox', { name: 'Template' });

describe('CustomMessageCard', () => {
  it('previews the request filled with a sample of an event the webhook sends', () => {
    drawn();

    const preview = screen.getByText(/POST https:\/\/hooks\.example\/valence/u);

    expect(preview).toHaveTextContent('Content-Type: application/json');
    expect(preview).toHaveTextContent('"title": "Scan library failed"');
    expect(preview).toHaveTextContent('"urgent": true');
  });

  it('shows the headers it sends, hiding a secret value', () => {
    drawn({
      ...DEFAULT_CUSTOM_WEBHOOK,
      headers: [
        { name: 'Authorization', value: '', isSecret: true },
        { name: 'X-Source', value: 'valence', isSecret: false },
      ],
    });

    const preview = screen.getByText(/POST https/u);

    expect(preview).toHaveTextContent('Authorization: ••••••••');
    expect(preview).toHaveTextContent('X-Source: valence');
    expect(preview).toHaveTextContent('X-Valence-Signature: sha256=••••••••');
  });

  it('offers to save only once the template changes, and saves it', async () => {
    const user = userEvent.setup();
    const onSave = drawn({ ...DEFAULT_CUSTOM_WEBHOOK, format: 'text', template: '{{title}}' });

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

    fireEvent.change(template(), { target: { value: '{{title}}: {{summary}}' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('{{title}}: {{summary}}');
  });

  it('will not save a template it cannot read, and says where it goes wrong', () => {
    drawn();

    fireEvent.change(template(), { target: { value: '{"title": ' } });

    expect(screen.getByText(/This isn’t valid JSON/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('says which placeholders have nothing for the event previewed', () => {
    drawn({ ...DEFAULT_CUSTOM_WEBHOOK, format: 'text', template: '{{title}} {{nothing.here}}' });

    expect(
      screen.getByText(/\{\{nothing\.here\}\} has nothing for this event/u),
    ).toBeInTheDocument();
  });

  it('puts the default template back', async () => {
    const user = userEvent.setup();

    drawn({ ...DEFAULT_CUSTOM_WEBHOOK, template: '{"a": "{{title}}"}' });

    await user.click(screen.getByRole('button', { name: 'Reset to default' }));

    expect(template()).toHaveValue(DEFAULT_CUSTOM_WEBHOOK.template);
    expect(screen.getByRole('button', { name: 'Reset to default' })).toBeDisabled();
  });

  it('adds a placeholder where it is chosen', async () => {
    const user = userEvent.setup();

    drawn({ ...DEFAULT_CUSTOM_WEBHOOK, format: 'text', template: '' });

    await user.click(screen.getByRole('button', { name: 'summary' }));

    expect(template()).toHaveValue('{{summary}}');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CustomMessageCard.displayName).toBe('CustomMessageCard');
  });
});
