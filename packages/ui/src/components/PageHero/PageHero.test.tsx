import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHero } from './PageHero';

describe('PageHero', () => {
  it('names the page, with the words that matter most set apart', () => {
    render(<PageHero eyebrow="Changelog" lead="What is" accent="new" trail="in Valence" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'What is new in Valence' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('says what the page is for and what to do next, with a picture beside them', () => {
    render(
      <PageHero
        lead="Plugins"
        description="Add to Valence."
        actions={<button type="button">Write your own</button>}
        aside={<img src="/x.png" alt="A plugin" />}
      />,
    );

    expect(screen.getByText('Add to Valence.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Write your own' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A plugin' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PageHero.displayName).toBe('PageHero');
  });
});
