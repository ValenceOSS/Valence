import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CopyableAddress } from './CopyableAddress';

describe('CopyableAddress', () => {
  it('shows an address and copies it exactly', async () => {
    const writeText = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(
      <CopyableAddress
        title="Pings"
        detail="Give this to the service."
        address="https://valence.test/hook"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('https://valence.test/hook');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
