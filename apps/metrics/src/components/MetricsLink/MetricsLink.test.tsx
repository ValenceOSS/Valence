import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MetricsLink } from './MetricsLink';

describe('MetricsLink', () => {
  it('links to a page of this site, and says when it is used', () => {
    const onClick = vi.fn();

    render(
      <MetricsLink to="/about" className="font-medium" onClick={onClick}>
        About this data
      </MetricsLink>,
    );

    const link = screen.getByRole('link', { name: 'About this data' });

    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveClass('font-medium');

    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
    fireEvent.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetricsLink.displayName).toBe('MetricsLink');
  });
});
