import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PanelCardChoice } from './PanelCardChoice';

const OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'look', label: 'Unmatched (2)' },
];

describe('PanelCardChoice', () => {
  it('shows the choice taken on a quiet trigger in the card’s heading', () => {
    render(
      <PanelCardChoice label="Which titles" options={OPTIONS} value="all" onSelect={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Which titles' })).toHaveTextContent('All');
  });

  it('tells its caller which was chosen', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PanelCardChoice label="Which titles" options={OPTIONS} value="all" onSelect={onSelect} />,
    );

    await user.click(screen.getByRole('button', { name: 'Which titles' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Unmatched (2)' }));

    expect(onSelect).toHaveBeenCalledWith('look');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PanelCardChoice.displayName).toBe('PanelCardChoice');
  });
});
