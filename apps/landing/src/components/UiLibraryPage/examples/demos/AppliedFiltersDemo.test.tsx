import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppliedFiltersDemo } from './AppliedFiltersDemo';

describe('AppliedFiltersDemo', () => {
  it('clears every filter', async () => {
    render(<AppliedFiltersDemo />);

    await userEvent.click(screen.getByRole('button', { name: /Clear/ }));

    expect(screen.getByText('No filters. Everything is showing.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AppliedFiltersDemo.displayName).toBe('AppliedFiltersDemo');
  });
});
