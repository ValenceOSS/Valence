import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContractVignette } from './ContractVignette';

describe('ContractVignette', () => {
  it('shows a route drawn from its contract, in the API reference', () => {
    render(<ContractVignette />);

    expect(screen.getAllByText('API reference')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContractVignette.displayName).toBe('ContractVignette');
  });
});
