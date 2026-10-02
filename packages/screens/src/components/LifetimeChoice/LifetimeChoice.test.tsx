import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LifetimeChoice } from './LifetimeChoice';

describe('LifetimeChoice', () => {
  it('offers a day, a week and a month, and says which was chosen', async () => {
    const onChoose = vi.fn();

    render(<LifetimeChoice value={7} onChoose={onChoose} />);

    expect(screen.getByRole('button', { name: '7 days', pressed: true })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '30 days' }));

    expect(onChoose).toHaveBeenCalledWith(30);
  });
});
