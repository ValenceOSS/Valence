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
    render(<WindowBar />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('takes hold of the window it is laid over', () => {
    const { container } = render(<WindowBar />);

    expect(container.querySelector('[data-slot="window-bar"]')).toHaveClass(
      '[-webkit-app-region:drag]',
    );
  });

  it('says an update is available, once one is', () => {
    render(<WindowBar updateVersion="v1.2.0" />);

    expect(screen.getByRole('button', { name: 'Update available' })).toBeInTheDocument();
  });

  it('sends somebody to it when pressed', async () => {
    const user = userEvent.setup();
    const onInstallUpdate = vi.fn();

    render(<WindowBar updateVersion="v1.2.0" onInstallUpdate={onInstallUpdate} />);
    await user.click(screen.getByRole('button'));

    expect(onInstallUpdate).toHaveBeenCalled();
  });

  it('lets a press reach the button rather than moving the window', () => {
    render(<WindowBar updateVersion="v1.2.0" />);

    expect(screen.getByRole('button')).toHaveClass('[-webkit-app-region:no-drag]');
  });
});
