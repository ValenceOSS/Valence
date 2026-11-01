import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SecretShownOnce } from './SecretShownOnce';

describe('SecretShownOnce', () => {
  it('shows each part with a way to copy it, and which part was copied', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();

    render(
      <SecretShownOnce
        warning="Copy it now."
        details={[
          { id: 'login', name: 'Username', value: 'sam' },
          { id: 'secret', name: 'Password', value: 'q8Zr1VbW' },
        ]}
        copied="login"
        onCopy={onCopy}
      />,
    );

    expect(screen.getByText('Copy it now.')).toBeInTheDocument();
    expect(screen.getByText('q8Zr1VbW')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Username' })).toHaveTextContent('Copied');

    await user.click(screen.getByRole('button', { name: 'Copy Password' }));

    expect(onCopy).toHaveBeenCalledWith('secret', 'q8Zr1VbW');
  });

  it('leaves out the name where there is only the one part', () => {
    render(
      <SecretShownOnce
        warning="Copy it now."
        details={[{ id: 'key', name: null, value: 'vk_1' }]}
        copied={null}
        onCopy={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });
});
