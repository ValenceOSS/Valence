import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HoverHighlightDemo } from './HoverHighlightDemo';

describe('HoverHighlightDemo', () => {
  it('lists its rows', () => {
    render(<HoverHighlightDemo />);

    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HoverHighlightDemo.displayName).toBe('HoverHighlightDemo');
  });
});
