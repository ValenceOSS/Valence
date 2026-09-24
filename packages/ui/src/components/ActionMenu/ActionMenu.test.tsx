import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionMenu } from './ActionMenu';

const open = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Actions' }));

  return user;
};

const props = {
  label: 'Actions',
  trigger: <span aria-hidden>x</span>,
};

describe('ActionMenu', () => {
  it('is not a press on whatever it sits inside, whether opened or chosen from', async () => {
    const onPress = vi.fn();
    const onChoose = vi.fn();

    render(
      <div
        role="presentation"
        onClick={() => {
          onPress();
        }}
      >
        <ActionMenu
          {...props}
          groups={[{ items: [{ id: 'pin', label: 'Pin to the top', onChoose }] }]}
        />
      </div>,
    );

    const user = await open();

    await user.click(await screen.findByRole('menuitem', { name: 'Pin to the top' }));

    expect(onChoose).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stays shut until it is asked for', () => {
    render(<ActionMenu {...props} groups={[{ items: [] }]} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('lists what can be done', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[{ items: [{ id: 'scan', label: 'Run diagnostics', onChoose: vi.fn() }] }]}
      />,
    );

    await open();

    expect(await screen.findByRole('menuitem', { name: 'Run diagnostics' })).toBeInTheDocument();
  });

  it('does the thing that was chosen', async () => {
    const onChoose = vi.fn();

    render(
      <ActionMenu {...props} groups={[{ items: [{ id: 'scan', label: 'Scan', onChoose }] }]} />,
    );

    const user = await open();

    await user.click(await screen.findByRole('menuitem', { name: 'Scan' }));

    expect(onChoose).toHaveBeenCalled();
  });

  it('marks each row as somewhere the highlight can travel to', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[{ items: [{ id: 'scan', label: 'Scan', onChoose: vi.fn() }] }]}
      />,
    );

    await open();

    expect(await screen.findByRole('menuitem', { name: 'Scan' })).toHaveAttribute(
      'data-highlight',
      'scan',
    );
  });

  it('says what needs explaining behind an information mark rather than as small print', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[
          {
            items: [
              { id: 'x', label: 'File it', hint: 'Once it has downloaded.', onChoose: vi.fn() },
            ],
          },
        ]}
      />,
    );

    await open();

    expect(await screen.findByRole('menuitem', { name: 'File it' })).toBeInTheDocument();
    expect(screen.queryByText('Once it has downloaded.')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="menu-hint"]')).toBeInTheDocument();
  });

  it('writes a destructive action in red rather than merely listing it last', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[
          { items: [{ id: 'x', label: 'Disconnect', isDestructive: true, onChoose: vi.fn() }] },
        ]}
      />,
    );

    await open();

    expect(await screen.findByRole('menuitem', { name: 'Disconnect' })).toHaveClass('text-danger');
  });

  it('refuses an action that cannot be taken', async () => {
    const onChoose = vi.fn();

    render(
      <ActionMenu
        {...props}
        groups={[{ items: [{ id: 'x', label: 'Export', isDisabled: true, onChoose }] }]}
      />,
    );

    const user = await open();

    await user.click(await screen.findByRole('menuitem', { name: 'Export' }));

    expect(onChoose).not.toHaveBeenCalled();
  });

  it('names a group of actions when the division needs explaining', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[{ name: 'Danger', items: [{ id: 'x', label: 'Delete', onChoose: vi.fn() }] }]}
      />,
    );

    await open();

    expect(await screen.findByText('Danger')).toBeInTheDocument();
  });

  it('will not open when there is nothing to be done', () => {
    render(<ActionMenu {...props} isDisabled groups={[{ items: [] }]} />);

    expect(screen.getByRole('button', { name: 'Actions' })).toBeDisabled();
  });

  it("stands smaller where it is one row's own action, not a page-level one", () => {
    render(<ActionMenu {...props} size="sm" groups={[{ items: [] }]} />);

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveClass('size-7');
  });

  it('draws a face as a circle that is not lit when pointed at, and a raised control with an edge', () => {
    const { rerender } = render(<ActionMenu {...props} look="face" groups={[{ items: [] }]} />);

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveClass(
      'rounded-full',
      'hover:bg-transparent',
    );

    rerender(<ActionMenu {...props} look="raised" groups={[{ items: [] }]} />);

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveClass('border');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ActionMenu.displayName).toBe('ActionMenu');
  });

  it('is opaque, so the rows behind it do not show through', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[{ items: [{ id: 'x', label: 'Run now', onChoose: vi.fn() }] }]}
      />,
    );

    await open();

    const menu = await screen.findByRole('menu');

    expect(menu).toHaveClass('valence-float');
    expect(menu).not.toHaveClass('valence-surface');
  });

  it('draws a group that holds a control of its own, under its name', async () => {
    render(
      <ActionMenu
        {...props}
        groups={[{ name: 'Theme', items: [], control: <span>the tabs</span> }]}
      />,
    );

    await open();

    expect(await screen.findByText('the tabs')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });
});
