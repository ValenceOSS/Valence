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

  it('offers to try again after a download failed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<WindowBar update={{ kind: 'failed', version: '1.2.0' }} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: 'Retry update' }));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('lets a press reach the button rather than moving the window', () => {
    render(<WindowBar update={{ kind: 'available', version: '1.2.0' }} />);

    expect(screen.getByRole('button')).toHaveClass('[-webkit-app-region:no-drag]');
  });
});
