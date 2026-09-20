import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { describe, expect, it, vi } from 'vitest';
import { PanelCardAction } from './PanelCardAction';

describe('PanelCardAction', () => {
  it('says what it does and calls back when pressed', async () => {
    const onClick = vi.fn();

    render(
      <PanelCardAction icon={Add01Icon} onClick={onClick}>
        Add user
      </PanelCardAction>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Add user' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is transparent and small', () => {
    render(
      <PanelCardAction icon={Add01Icon} onClick={vi.fn()}>
        Add user
      </PanelCardAction>,
    );

    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'h-7');
  });

  it('draws its icon after the words', () => {
    render(
      <PanelCardAction icon={Add01Icon} onClick={vi.fn()}>
        Add user
      </PanelCardAction>,
    );

    expect(screen.getByRole('button').lastElementChild?.tagName.toLowerCase()).toBe('svg');
  });

  it('cannot be pressed while its work is under way', () => {
    render(
      <PanelCardAction icon={Add01Icon} isLoading onClick={vi.fn()}>
        Add user
      </PanelCardAction>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('cannot be pressed when disabled', () => {
    render(
      <PanelCardAction icon={Add01Icon} isDisabled onClick={vi.fn()}>
        Add user
      </PanelCardAction>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PanelCardAction.displayName).toBe('PanelCardAction');
  });
});
