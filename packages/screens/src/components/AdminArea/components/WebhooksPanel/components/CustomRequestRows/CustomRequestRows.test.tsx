import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CUSTOM_TEMPLATES } from '@ValenceContracts/constants/DEFAULT_CUSTOM_TEMPLATES';
import { DEFAULT_CUSTOM_WEBHOOK } from '@ValenceContracts/constants/DEFAULT_CUSTOM_WEBHOOK';
import { CustomRequestRows } from './CustomRequestRows';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const drawn = (setup: CustomWebhook = DEFAULT_CUSTOM_WEBHOOK) => {
  const onChange = vi.fn();

  render(<CustomRequestRows setup={setup} onChange={onChange} />);

  return onChange;
};

describe('CustomRequestRows', () => {
  it('saves a new method at once', async () => {
    const user = userEvent.setup();
    const onChange = drawn();

    await user.click(screen.getByRole('button', { name: 'PUT' }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_CUSTOM_WEBHOOK, method: 'PUT' });
  });

  it('swaps an untouched default template for the new format’s', async () => {
    const user = userEvent.setup();
    const onChange = drawn();

    await user.click(screen.getByRole('button', { name: 'Body format' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Plain text' }));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_CUSTOM_WEBHOOK,
      format: 'text',
      template: DEFAULT_CUSTOM_TEMPLATES.text,
    });
  });

  it('keeps a template somebody wrote when the format changes', async () => {
    const user = userEvent.setup();
    const onChange = drawn({ ...DEFAULT_CUSTOM_WEBHOOK, template: '{"say": "{{title}}"}' });

    await user.click(screen.getByRole('button', { name: 'Body format' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Form' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'form', template: '{"say": "{{title}}"}' }),
    );
  });

  it('turns signing off', async () => {
    const user = userEvent.setup();
    const onChange = drawn();

    await user.click(screen.getByRole('switch', { name: 'Sign each message' }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_CUSTOM_WEBHOOK, isSigned: false });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CustomRequestRows.displayName).toBe('CustomRequestRows');
  });
});
