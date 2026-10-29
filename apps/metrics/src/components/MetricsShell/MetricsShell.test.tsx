import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { MetricsShell } from './MetricsShell';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

describe('MetricsShell', () => {
  it('puts the page between the places along the top and the links along the bottom', () => {
    render(
      <MetricsShell>
        <p>The page</p>
      </MetricsShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('The page');
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The code for this site' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('marks the page that is open', () => {
    vi.mocked(usePathname).mockReturnValue('/about');

    render(
      <MetricsShell>
        <p>About</p>
      </MetricsShell>,
    );

    expect(screen.getByRole('link', { name: 'About this data' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Statistics' })).not.toHaveAttribute('aria-current');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetricsShell.displayName).toBe('MetricsShell');
  });
});
