import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTableDemo } from './DataTableDemo';

describe('DataTableDemo', () => {
  it('lists the films', () => {
    render(<DataTableDemo />);

    expect(screen.getByText('Blade Runner 2049')).toBeInTheDocument();
    expect(screen.getByText('58.1 GB')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DataTableDemo.displayName).toBe('DataTableDemo');
  });
});
