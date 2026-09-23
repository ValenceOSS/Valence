import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from './Link';

describe('Link', () => {
  it('opens another site in a new tab, without handing it this page', () => {
    render(<Link href="https://docs.getvalence.app/install/requesting">How to fix this</Link>);

    const link = screen.getByRole('link', { name: 'How to fix this' });

    expect(link).toHaveAttribute('href', 'https://docs.getvalence.app/install/requesting');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('opens an address on this site where it is', () => {
    render(<Link href="/admin/requests">Requests</Link>);

    const link = screen.getByRole('link', { name: 'Requests' });

    expect(link).toHaveAttribute('href', '/admin/requests');
    expect(link).not.toHaveAttribute('target');
  });

  it('takes the caller’s own classes beside its look', () => {
    render(
      <Link href="/x" className="text-xs">
        X
      </Link>,
    );

    expect(screen.getByRole('link', { name: 'X' })).toHaveClass('text-xs', 'underline');
  });

  it('opens a whole address on this same site where it is', () => {
    render(<Link href={`${window.location.origin}/admin/requests`}>Requests</Link>);

    expect(screen.getByRole('link', { name: 'Requests' })).not.toHaveAttribute('target');
  });

  it('takes an address with no scheme of its own for another site where it names one', () => {
    render(<Link href="//docs.getvalence.app/install/requesting">The docs</Link>);

    expect(screen.getByRole('link', { name: 'The docs' })).toHaveAttribute('target', '_blank');
  });

  it('opens an address it cannot read where it is', () => {
    render(<Link href="http://[not an address">Broken</Link>);

    expect(screen.getByRole('link', { name: 'Broken' })).not.toHaveAttribute('target');
  });
});
