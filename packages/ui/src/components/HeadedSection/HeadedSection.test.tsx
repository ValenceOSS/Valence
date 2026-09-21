import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeadedSection } from './HeadedSection';

describe('HeadedSection', () => {
  it('is a region named by its heading', () => {
    render(
      <HeadedSection title="Top sources">
        <p>Content</p>
      </HeadedSection>,
    );

    expect(screen.getByRole('region', { name: 'Top sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Top sources' })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('carries its own controls at the end of the heading', () => {
    render(
      <HeadedSection title="Lines" actions={<span>Showing 4 of 9</span>}>
        <p>Content</p>
      </HeadedSection>,
    );

    expect(screen.getByText('Showing 4 of 9')).toBeInTheDocument();
  });

  it('draws no box of its own, so it is never a card', () => {
    const { container } = render(
      <HeadedSection title="Lines">
        <p>Content</p>
      </HeadedSection>,
    );

    expect(container.querySelector('.valence-card-shell, .valence-card-face')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HeadedSection.displayName).toBe('HeadedSection');
  });
});
