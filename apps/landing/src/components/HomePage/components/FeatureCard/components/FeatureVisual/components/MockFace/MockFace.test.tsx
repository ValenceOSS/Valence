import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MockFace } from './MockFace';

describe('MockFace', () => {
  it('draws somebody as their initial', () => {
    render(<MockFace name="Jonah" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('colours the initial with the tone it is given', () => {
    render(<MockFace name="Ruth" tone="bg-busy" />);

    expect(screen.getByText('R')).toHaveClass('bg-busy');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MockFace.displayName).toBe('MockFace');
  });
});
