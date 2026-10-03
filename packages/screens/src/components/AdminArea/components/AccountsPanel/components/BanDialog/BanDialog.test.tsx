import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BanDialog } from './BanDialog';

describe('BanDialog', () => {
  it('bans with the reason given', async () => {
    const onBan = vi.fn();

    render(<BanDialog name="Sam" onClose={vi.fn()} onBan={onBan} />);

    const reason = screen.getByLabelText('Reason shown to them');

    await userEvent.clear(reason);
    await userEvent.type(reason, 'Sharing the password around');
    await userEvent.click(screen.getByRole('button', { name: 'Ban' }));

    expect(onBan).toHaveBeenCalledWith('Sharing the password around');
  });

  it('starts with the usual reason filled in', () => {
    render(<BanDialog name="Sam" onClose={vi.fn()} onBan={vi.fn()} />);

    expect(screen.getByLabelText('Reason shown to them')).not.toHaveValue('');
  });

  it('will not ban without a reason, and says so', async () => {
    const onBan = vi.fn();

    render(<BanDialog name="Sam" onClose={vi.fn()} onBan={onBan} />);

    await userEvent.clear(screen.getByLabelText('Reason shown to them'));
    await userEvent.click(screen.getByRole('button', { name: 'Ban' }));

    expect(onBan).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('is shut while nobody is to be banned', () => {
    render(<BanDialog name={null} onClose={vi.fn()} onBan={vi.fn()} />);

    expect(screen.queryByLabelText('Reason shown to them')).not.toBeInTheDocument();
  });
});
