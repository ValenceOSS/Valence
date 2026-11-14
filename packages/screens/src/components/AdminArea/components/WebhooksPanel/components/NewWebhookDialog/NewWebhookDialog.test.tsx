import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NewWebhookDialog } from './NewWebhookDialog';
import type { Refusal } from '@ValenceClient/admin/fetchWebhooks';

const drawn = (refusal: Refusal = null) => {
  const onCreate = vi.fn().mockResolvedValue(refusal);
  const onClose = vi.fn();

  render(<NewWebhookDialog isOpen onClose={onClose} onCreate={onCreate} />);

  return { onCreate, onClose };
};

describe('NewWebhookDialog', () => {
  it('offers every service but Custom, which is chosen on the webhook’s page', async () => {
    const user = userEvent.setup();

    drawn();
    await user.click(screen.getByRole('button', { name: 'Service' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Discord' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: 'Custom' })).not.toBeInTheDocument();
  });

  it('says under the address what is wrong with it, and sends nothing', async () => {
    const user = userEvent.setup();
    const { onCreate } = drawn();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Paste the address to post to.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'not an address');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText(/isn’t a web address/u)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('names a webhook after its service where no name was given, starting with failed jobs', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = drawn();

    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'https://hooks.example/a');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Discord',
        url: 'https://hooks.example/a',
        preset: 'discord',
        events: ['job.failed'],
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('starts a webhook on the local network where the switch is turned on', async () => {
    const user = userEvent.setup();
    const { onCreate } = drawn();

    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'http://192.168.1.5/hook');
    await user.click(screen.getByRole('switch', { name: 'Local network' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ reachesLocalNetwork: true }));
  });

  it('keeps a new webhook off the local network by default', async () => {
    const user = userEvent.setup();
    const { onCreate } = drawn();

    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'https://hooks.example/a');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ reachesLocalNetwork: false }));
  });

  it('stays open and says why where the server refuses', async () => {
    const user = userEvent.setup();
    const { onClose } = drawn({ message: 'That address points inside this network.' });

    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'https://hooks.example/a');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That address points inside this network.',
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NewWebhookDialog.displayName).toBe('NewWebhookDialog');
  });
});
