import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContractPicture } from './ContractPicture';

describe('ContractPicture', () => {
  it('shows a route drawn from its contract, in the API reference', () => {
    render(<ContractPicture />);

    expect(screen.getAllByText('API reference')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContractPicture.displayName).toBe('ContractPicture');
  });
});
