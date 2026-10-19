import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UpdateWindow } from './UpdateWindow';

describe('UpdateWindow', () => {
  it('says an update is being installed, and which version, before the restart', () => {
    render(<UpdateWindow step="installing" version="1.5.0" />);

    expect(screen.getByRole('status')).toHaveTextContent('Installing update');
    expect(screen.getByRole('status')).toHaveTextContent('Valence 1.5.0');
  });

  it('says the update is finishing once the new version has opened', () => {
    render(<UpdateWindow step="finishing" version="1.5.0" />);

    expect(screen.getByRole('status')).toHaveTextContent('Finishing update');
  });

  it('moves its bar without a position, since the installer never says how far it has got', () => {
    render(<UpdateWindow step="installing" version="1.5.0" />);

    expect(screen.getByRole('progressbar', { name: 'Installing update' })).not.toHaveAttribute(
      'aria-valuenow',
    );
  });

  it('can be picked up and moved anywhere on it, having no frame of its own', () => {
    const { container } = render(<UpdateWindow step="installing" version="1.5.0" />);

    expect(container.querySelector('main')).toHaveClass('[-webkit-app-region:drag]');
  });
});
