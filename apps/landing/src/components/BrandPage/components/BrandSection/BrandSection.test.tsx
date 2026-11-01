import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandSection } from './BrandSection';

describe('BrandSection', () => {
  it('names its part, says what it is for and holds it', () => {
    render(
      <BrandSection id="colour" title="Colour" text="The colours Valence uses.">
        <p>Swatches</p>
      </BrandSection>,
    );

    const part = screen.getByRole('region', { name: 'Colour' });

    expect(part).toHaveAttribute('id', 'colour');
    expect(screen.getByRole('heading', { level: 2, name: 'Colour' })).toBeInTheDocument();
    expect(screen.getByText('The colours Valence uses.')).toBeInTheDocument();
    expect(screen.getByText('Swatches')).toBeInTheDocument();
  });

  it('sets what can be saved from it beside the title', () => {
    render(
      <BrandSection title="Wallpapers" text="Ten wallpapers." actions={<span>Save the pack</span>}>
        <p>Wallpapers</p>
      </BrandSection>,
    );

    expect(screen.getByText('Save the pack')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandSection.displayName).toBe('BrandSection');
  });
});
