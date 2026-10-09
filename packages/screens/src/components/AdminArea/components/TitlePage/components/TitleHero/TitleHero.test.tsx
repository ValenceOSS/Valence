import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitleHero } from './TitleHero';

describe('TitleHero', () => {
  it('names the title, where it stands, its facts, who asked, and what can be done', () => {
    render(
      <TitleHero
        title="A Show"
        year={2019}
        artUrl="/poster.jpg"
        art="poster"
        backdropUrl="/backdrop.jpg"
        status="missing"
        facts={['Drama', '3 seasons']}
        overview="What it is about."
        askedBy={<span>Asked for by Sam</span>}
        actions={<span>Actions</span>}
      />,
    );

    expect(screen.getByRole('heading', { name: /A Show\s*2019/ })).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('3 seasons')).toBeInTheDocument();
    expect(screen.getByText('What it is about.')).toBeInTheDocument();
    expect(screen.getByText(/Asked for by Sam/)).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('leaves out what it does not have', () => {
    const { container } = render(
      <TitleHero
        title="A Film"
        year={null}
        artUrl={null}
        art="poster"
        backdropUrl={null}
        status="notFollowed"
        facts={[]}
        overview={null}
        askedBy={null}
        actions={null}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText(/Asked for by/)).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleHero.displayName).toBe('TitleHero');
  });
});
