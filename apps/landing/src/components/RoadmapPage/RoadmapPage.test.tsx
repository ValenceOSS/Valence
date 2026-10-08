import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoadmapPage } from './RoadmapPage';

describe('RoadmapPage', () => {
  it('names the page', () => {
    render(<RoadmapPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What Valence is');
  });

  it('sets out every point the page makes', () => {
    render(<RoadmapPage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Own the home stack' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoadmapPage.displayName).toBe('RoadmapPage');
  });
});
