import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SplitButton } from './SplitButton';

const EDITIONS = [
  { id: 'bluray', label: 'Bluray-1080p' },
  { id: 'cut', label: 'Extended Cut' },
];

describe('SplitButton', () => {
  it('does its main action from the main part', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SplitButton
        onClick={onClick}
        choiceLabel="Which edition to play"
        choiceName="Editions"
        options={EDITIONS}
        selectedId="bluray"
        onSelect={vi.fn()}
      >
        Play
      </SplitButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(onClick).toHaveBeenCalled();
  });

  it('chooses from the arrow without doing the action, and ticks what is chosen', async () => {
    const onClick = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <SplitButton
        onClick={onClick}
        choiceLabel="Which edition to play"
        choiceName="Editions"
        options={EDITIONS}
        selectedId="bluray"
        onSelect={onSelect}
      >
        Play
      </SplitButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Which edition to play' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Bluray-1080p' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await user.click(screen.getByRole('menuitemradio', { name: 'Extended Cut' }));

    expect(onSelect).toHaveBeenCalledWith('cut');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SplitButton.displayName).toBe('SplitButton');
  });
});
