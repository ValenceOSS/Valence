import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContextMenu } from './ContextMenu';

const open = () => {
  fireEvent.contextMenu(screen.getByText('Even In Arcadia'));
};

describe('ContextMenu', () => {
  it('opens where the thing was right-clicked, with what can be done to it', async () => {
    render(
      <ContextMenu
        label="Even In Arcadia"
        groups={[{ items: [{ id: 'play', label: 'Play', onChoose: vi.fn() }] }]}
      >
        <span>Even In Arcadia</span>
      </ContextMenu>,
    );

    open();

    expect(await screen.findByRole('menuitem', { name: 'Play' })).toBeInTheDocument();
  });

  it('does what was chosen', async () => {
    const onChoose = vi.fn();

    render(
      <ContextMenu
        label="Even In Arcadia"
        groups={[{ items: [{ id: 'play', label: 'Play', onChoose }] }]}
      >
        <span>Even In Arcadia</span>
      </ContextMenu>,
    );

    open();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Play' }));

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('names its groups and keeps a disabled item visible', async () => {
    render(
      <ContextMenu
        label="Even In Arcadia"
        groups={[
          {
            name: 'Playing',
            items: [{ id: 'next', label: 'Play next', isDisabled: true, onChoose: vi.fn() }],
          },
        ]}
      >
        <span>Even In Arcadia</span>
      </ContextMenu>,
    );

    open();

    expect(await screen.findByText('Playing')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Play next' })).toHaveAttribute('data-disabled');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContextMenu.displayName).toBe('ContextMenu');
  });
});
