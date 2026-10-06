import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WindowBar } from './WindowBar';

describe('WindowBar', () => {
  it('gives a frameless window somewhere to be picked up by', () => {
    const { container } = render(<WindowBar />);

    expect(container.querySelector('[data-slot="window-bar"]')).toBeInTheDocument();
  });

  it('draws a surface and nothing on it where there is no update', () => {
    render(<WindowBar update={{ kind: 'none' }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays usable over a dialog, so a press reaches it rather than closing the dialog', () => {
    const { container } = render(<WindowBar />);

    expect(container.querySelector('[data-slot="window-bar"]')).toHaveAttribute(
      'data-over-dialogs',
    );
  });

  it('takes hold of the window it is laid over', () => {
    const { container } = render(<WindowBar />);

    expect(container.querySelector('[data-slot="window-bar"]')).toHaveClass(
      '[-webkit-app-region:drag]',
    );
  });

  it('offers a release it has found, by its version', () => {
    render(<WindowBar update={{ kind: 'available', version: '1.2.0' }} />);

    expect(screen.getByRole('button', { name: 'Update to 1.2.0' })).toBeInTheDocument();
  });

  it('fetches it when pressed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<WindowBar update={{ kind: 'available', version: '1.2.0' }} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button'));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('says how far a download has got, with nothing to press', () => {
    render(<WindowBar update={{ kind: 'downloading', version: '1.2.0', percent: 45 }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Updating 45%');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fills a bar beneath the words as the download goes', () => {
    render(<WindowBar update={{ kind: 'downloading', version: '1.2.0', percent: 45 }} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');
  });

  it('offers to try again after a download failed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<WindowBar update={{ kind: 'failed', version: '1.2.0' }} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: 'Retry update' }));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('lets a press reach the button rather than moving the window', () => {
    render(<WindowBar update={{ kind: 'available', version: '1.2.0' }} />);

    expect(screen.getByRole('button').parentElement).toHaveClass('[-webkit-app-region:no-drag]');
  });

  it('goes back and forward through the window’s history, dimming a way that leads nowhere', async () => {
    const user = userEvent.setup();
    const ways = { canGoBack: true, canGoForward: false, back: vi.fn(), forward: vi.fn() };

    render(<WindowBar ways={ways} />);

    const back = screen.getByRole('button', { name: 'Go back' });
    const forward = screen.getByRole('button', { name: 'Go forward' });

    expect(back).toBeEnabled();
    expect(forward).toBeDisabled();
    expect(forward).toHaveClass('disabled:opacity-50');

    await user.click(back);

    expect(ways.back).toHaveBeenCalledOnce();
    expect(back.parentElement).toHaveClass('[-webkit-app-region:no-drag]');
  });

  it('opens the docs from its question mark', async () => {
    const user = userEvent.setup();
    const onHelp = vi.fn();

    render(<WindowBar onHelp={onHelp} />);

    await user.click(screen.getByRole('button', { name: 'Help' }));

    expect(onHelp).toHaveBeenCalledOnce();
  });

  it('draws a release it has found as a green arrow, and a failed one as a red one', () => {
    const { rerender } = render(<WindowBar update={{ kind: 'available', version: '1.2.0' }} />);

    expect(screen.getByRole('button', { name: 'Update to 1.2.0' })).toHaveClass('text-success');

    rerender(<WindowBar update={{ kind: 'failed', version: '1.2.0' }} />);

    expect(screen.getByRole('button', { name: 'Retry update' })).toHaveClass('text-danger');
  });

  it('names the keys for each way through the history', async () => {
    const user = userEvent.setup();
    const ways = { canGoBack: true, canGoForward: true, back: vi.fn(), forward: vi.fn() };

    render(<WindowBar ways={ways} keys={{ back: ['⌘', '['], forward: ['⌘', ']'] }} />);

    await user.hover(screen.getByRole('button', { name: 'Go back' }));

    expect(await screen.findByText('[')).toBeInTheDocument();
  });

  it('holds the inbox where somebody has one', () => {
    render(
      <WindowBar
        inbox={{
          notifications: [],
          unread: 2,
          onOpen: vi.fn(),
          onRead: vi.fn(),
          onReadAll: vi.fn(),
          onClearAll: vi.fn(),
          onFollow: vi.fn(),
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveTextContent('2');
  });

  it('draws minimise, maximise and close at the far right where it is given the frame', async () => {
    const user = userEvent.setup();
    const frame = { isMaximised: false, minimise: vi.fn(), maximise: vi.fn(), close: vi.fn() };
    const { container } = render(<WindowBar frame={frame} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(frame.close).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Minimise' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="window-controls"]')?.parentElement).toHaveClass(
      '[-webkit-app-region:no-drag]',
    );
    expect(container.querySelector('[data-slot="window-bar"]')).not.toHaveClass(
      'pr-[var(--valence-window-bar-clearance)]',
    );
  });

  it('leaves the window’s controls to the system where it is not given the frame', () => {
    const { container } = render(<WindowBar />);

    expect(container.querySelector('[data-slot="window-controls"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="window-bar"]')).toHaveClass(
      'pr-[var(--valence-window-bar-clearance)]',
    );
  });
});
