import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DialogFooter } from './DialogFooter';

describe('DialogFooter', () => {
  it('holds the answers to the dialog', () => {
    render(
      <DialogFooter>
        <span>Cancel</span>
        <span>Save</span>
      </DialogFooter>,
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent('CancelSave');
  });

  it('gives every answer the same width once there is room, so none is suggested by being larger', () => {
    render(
      <DialogFooter>
        <span>Save</span>
      </DialogFooter>,
    );

    expect(screen.getByRole('contentinfo')).toHaveClass(
      'sm:grid-flow-col',
      'sm:[grid-auto-columns:1fr]',
      '[&>*]:w-full',
    );
  });

  it('stacks them on a phone, where three answers across cannot fit and a button will not shrink', () => {
    render(
      <DialogFooter>
        <span>Save</span>
      </DialogFooter>,
    );

    const foot = screen.getByRole('contentinfo');

    expect(foot).toHaveClass('grid');
    expect(foot.className).not.toMatch(/(^|\s)grid-flow-col/);
    expect(foot.className).not.toMatch(/(^|\s)\[grid-auto-columns:1fr\]/);
  });

  it('is the shade of the sidebar, like the head', () => {
    render(
      <DialogFooter>
        <span>Save</span>
      </DialogFooter>,
    );

    const foot = screen.getByRole('contentinfo');

    expect(foot).toHaveClass('border-t', 'bg-[var(--color-surface-raised)]');
  });

  it('keeps the classes a caller gave it', () => {
    render(
      <DialogFooter className="justify-end">
        <span>Save</span>
      </DialogFooter>,
    );

    expect(screen.getByRole('contentinfo')).toHaveClass('justify-end');
  });

  it('says Cancel for the way out when there is an answer to cancel', () => {
    render(
      <DialogFooter
        dismiss={{ onChoose: vi.fn() }}
        confirm={{ label: 'Save', onChoose: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('says Close for the way out when the dialog is only something to read', () => {
    render(<DialogFooter dismiss={{ onChoose: vi.fn() }} />);

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('lets the way out say something else when it means something else', () => {
    render(<DialogFooter dismiss={{ label: 'Back', onChoose: vi.fn() }} />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('tells the dialog which button was chosen', async () => {
    const onDismiss = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DialogFooter
        dismiss={{ onChoose: onDismiss }}
        confirm={{ label: 'Save', onChoose: onConfirm }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('paints the way out quietly and the answer white', () => {
    render(
      <DialogFooter
        dismiss={{ onChoose: vi.fn() }}
        confirm={{ label: 'Save', onChoose: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('bg-white');
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass('bg-white');
  });

  it('paints an answer that destroys something red', () => {
    render(<DialogFooter confirm={{ label: 'Delete', onChoose: vi.fn(), isDestructive: true }} />);

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-danger');
  });

  it('disables and busies the buttons it was told to', () => {
    render(
      <DialogFooter
        dismiss={{ onChoose: vi.fn(), isDisabled: true }}
        confirm={{ label: 'Save', onChoose: vi.fn(), isLoading: true, isDisabled: true }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('says why the last attempt was refused, as an alert', () => {
    render(
      <DialogFooter note="That name is taken." confirm={{ label: 'Save', onChoose: vi.fn() }} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('That name is taken.');
  });

  it('says nothing when there is nothing to say', () => {
    render(<DialogFooter note={null} confirm={{ label: 'Save', onChoose: vi.fn() }} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('puts what a dialog adds of its own between the way out and the answer', () => {
    render(
      <DialogFooter dismiss={{ onChoose: vi.fn() }} confirm={{ label: 'Save', onChoose: vi.fn() }}>
        <span>Try it</span>
      </DialogFooter>,
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent('CancelTry itSave');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogFooter.displayName).toBe('DialogFooter');
  });

  it('paints the way out in the default gray rather than black', () => {
    render(
      <DialogFooter
        dismiss={{ onChoose: vi.fn() }}
        confirm={{ label: 'Save', onChoose: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('bg-[var(--surface-hover)]');
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass('bg-background');
  });
});
