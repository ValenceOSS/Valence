import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArchitecturePage } from './ArchitecturePage';

describe('ArchitecturePage', () => {
  it('names the page', () => {
    render(<ArchitecturePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('One server, many');
  });

  it('sets out every point the page makes', () => {
    render(<ArchitecturePage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getByRole('heading', { level: 2, name: 'Server first' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArchitecturePage.displayName).toBe('ArchitecturePage');
  });
});
