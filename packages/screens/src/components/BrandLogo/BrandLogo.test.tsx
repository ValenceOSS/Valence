import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('draws the logo an administrator gave the server', () => {
    const { container } = render(<BrandLogo logo="https://example.com/logo.png" size={56} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('draws Valence’s mark where the server has no logo of its own', () => {
    render(<BrandLogo logo={null} size={56} label="Valence" />);

    expect(screen.getByRole('img', { name: 'Valence' })).toBeInTheDocument();
  });

  it('falls back to Valence’s mark when the logo cannot be loaded', () => {
    const { container } = render(
      <BrandLogo logo="https://example.com/gone.png" size={56} label="Valence" />,
    );
    const broken = container.querySelector('img[src="https://example.com/gone.png"]');

    if (broken === null) {
      throw new Error('The logo was never drawn.');
    }

    fireEvent.error(broken);

    expect(container.querySelector('img[src="https://example.com/gone.png"]')).toBeNull();
    expect(screen.getByRole('img', { name: 'Valence' })).toBeInTheDocument();
  });

  it('tries a new logo again after an old one failed', () => {
    const { container, rerender } = render(
      <BrandLogo logo="https://example.com/gone.png" size={56} />,
    );
    const broken = container.querySelector('img');

    if (broken === null) {
      throw new Error('The logo was never drawn.');
    }

    fireEvent.error(broken);
    rerender(<BrandLogo logo="https://example.com/new.png" size={56} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/new.png');
  });
});
