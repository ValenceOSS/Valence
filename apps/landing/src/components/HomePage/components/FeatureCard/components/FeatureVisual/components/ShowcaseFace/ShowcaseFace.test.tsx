import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShowcaseFace } from './ShowcaseFace';

describe('ShowcaseFace', () => {
  it('draws somebody as their initial', () => {
    render(<ShowcaseFace name="Jonah" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('draws somebody outside the household too', () => {
    render(<ShowcaseFace name="Zed" className="size-12" />);

    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShowcaseFace.displayName).toBe('ShowcaseFace');
  });
});
