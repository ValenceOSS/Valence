import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { MetricsShell } from './MetricsShell';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

describe('MetricsShell', () => {
  it('puts the page between Valence’s own bar and footer', () => {
    render(
      <MetricsShell starCount={235}>
        <p>The page</p>
      </MetricsShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('The page');
    expect(screen.getByRole('navigation', { name: 'Valence' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByText(/MIT licensed/)).toBeInTheDocument();
  });

  it('leads back to the main site from the bar', () => {
    render(
      <MetricsShell starCount={null}>
        <p>The page</p>
      </MetricsShell>,
    );

    expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute(
      'href',
      'https://getvalence.app',
    );
  });

  it('marks the page that is open', () => {
    vi.mocked(usePathname).mockReturnValue('/about');

    render(
      <MetricsShell starCount={null}>
        <p>About</p>
      </MetricsShell>,
    );

    const pages = screen.getByRole('navigation', { name: 'Pages' });

    expect(screen.getByRole('link', { name: 'About this data' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(pages.querySelector('[aria-current]')).toHaveTextContent('About this data');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetricsShell.displayName).toBe('MetricsShell');
  });
});
