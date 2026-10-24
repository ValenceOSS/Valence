import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrustBadge } from './TrustBadge';

describe('TrustBadge', () => {
  it('says who vouches for a plugin', () => {
    const { rerender } = render(<TrustBadge trust="official" />);

    expect(screen.getByText('Official')).toBeInTheDocument();

    rerender(<TrustBadge trust="trusted" />);

    expect(screen.getByText('Key you trust')).toBeInTheDocument();

    rerender(<TrustBadge trust="unsigned" isAsking />);

    expect(screen.getByText('Not signed')).toBeInTheDocument();
  });
});
