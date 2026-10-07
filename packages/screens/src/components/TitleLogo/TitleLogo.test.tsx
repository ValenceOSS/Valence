import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TitleLogo } from './TitleLogo';

describe('TitleLogo', () => {
  it('fades in once it has loaded, drawn as the catalogue gives it', () => {
    render(<TitleLogo src="/logo.png" alt="Arrival" />);

    const logo = screen.getByRole('img', { name: 'Arrival' });

    expect(logo).toHaveClass('opacity-0');

    fireEvent.load(logo);

    expect(logo).toHaveClass('opacity-100');
    expect(logo).not.toHaveClass('invert');
    expect(logo).toHaveAttribute('src', '/logo.png');
  });

  it('fades a new logo in afresh rather than showing it before it has loaded', () => {
    const { rerender } = render(<TitleLogo src="/one.png" alt="Arrival" />);

    fireEvent.load(screen.getByRole('img', { name: 'Arrival' }));
    rerender(<TitleLogo src="/two.png" alt="Arrival" />);

    expect(screen.getByRole('img', { name: 'Arrival' })).toHaveClass('opacity-0');
  });

  it('says when it cannot be loaded, so the title can be set in type instead', () => {
    const onError = vi.fn();

    render(<TitleLogo src="/missing.png" alt="Arrival" onError={onError} />);

    fireEvent.error(screen.getByRole('img', { name: 'Arrival' }));

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('keeps the size and place its caller gives it', () => {
    render(<TitleLogo src="/logo.png" alt="Arrival" className="max-h-[22svh]" />);

    expect(screen.getByRole('img', { name: 'Arrival' })).toHaveClass('max-h-[22svh]');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleLogo.displayName).toBe('TitleLogo');
  });
});
