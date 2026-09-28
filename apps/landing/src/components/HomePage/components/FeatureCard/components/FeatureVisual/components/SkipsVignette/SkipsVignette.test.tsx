import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipsVignette } from './SkipsVignette';

describe('SkipsVignette', () => {
  it('offers to skip the intro on the timeline of an episode', () => {
    render(<SkipsVignette />);

    expect(screen.getAllByText('Skip Intro')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SkipsVignette.displayName).toBe('SkipsVignette');
  });
});
