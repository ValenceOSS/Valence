import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SetupLinkHandover } from './SetupLinkHandover';

const LINK = { url: 'https://valence.example/welcome/abc', expiresAt: '2026-10-09T00:00:00.000Z' };

describe('SetupLinkHandover', () => {
  it('shows the link to copy and as a code to scan, and says it is not kept', async () => {
    render(<SetupLinkHandover link={LINK} name="Ada" />);

    expect(screen.getByText(LINK.url)).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /Ada/ })).toBeInTheDocument();
    expect(screen.getByText(/keeps no copy/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send by email/ })).not.toBeInTheDocument();
  });

  it('offers to send it by email where it can', async () => {
    const onEmail = vi.fn();

    render(<SetupLinkHandover link={LINK} name="Ada" onEmail={onEmail} />);

    await userEvent.click(screen.getByRole('button', { name: /Send by email/ }));

    expect(onEmail).toHaveBeenCalled();
  });
});
