import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setQueueConcurrency } from '@ValenceClient/admin/fetchAdmin';
import { QueueConcurrency } from './QueueConcurrency';

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  setQueueConcurrency: vi.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  vi.mocked(setQueueConcurrency).mockClear();
});

describe('QueueConcurrency', () => {
  it('says how many run at once, on the button that opens the slider', () => {
    render(<QueueConcurrency concurrency={3} />);

    expect(screen.getByRole('button', { name: 'How many jobs run at once' })).toHaveTextContent(
      '3 at a time',
    );
  });

  it('opens a slider set to how many run now', async () => {
    render(<QueueConcurrency concurrency={3} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'How many jobs run at once' }));

    expect(await screen.findByRole('slider', { name: 'Jobs at once' })).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
  });

  it('asks for the number chosen when the slider is let go, and never for none', async () => {
    const user = userEvent.setup();

    render(<QueueConcurrency concurrency={3} />);

    await user.click(screen.getByRole('button', { name: 'How many jobs run at once' }));

    const slider = await screen.findByRole('slider', { name: 'Jobs at once' });

    slider.focus();
    await user.keyboard('{Home}');

    expect(setQueueConcurrency).toHaveBeenLastCalledWith(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(QueueConcurrency.displayName).toBe('QueueConcurrency');
  });
});
