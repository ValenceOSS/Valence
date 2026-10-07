import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DockedBand } from './DockedBand';

describe('DockedBand', () => {
  it('runs the name across the top once the hero band has gone', () => {
    render(<DockedBand isShown />);

    expect(screen.getAllByText('Valence').length).toBeGreaterThan(0);
  });

  it('draws nothing while the hero band is still in sight', () => {
    render(<DockedBand isShown={false} />);

    expect(screen.queryByText('Valence')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DockedBand.displayName).toBe('DockedBand');
  });
});
