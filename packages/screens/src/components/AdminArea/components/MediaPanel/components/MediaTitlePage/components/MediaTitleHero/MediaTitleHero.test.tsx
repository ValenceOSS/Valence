import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaTitleHero } from './MediaTitleHero';

describe('MediaTitleHero', () => {
  it('names the title in large type with its year, facts, overview, actions and tabs', () => {
    render(
      <MediaTitleHero
        name="Arrival"
        year={2016}
        posterUrl={null}
        badges={<span>4K</span>}
        facts={['Films', '1 file']}
        overview="Linguists meet visitors."
        actions={<button type="button">Fix match</button>}
        tabs={<span>The tabs</span>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arrival2016');
    expect(screen.getByText('4K')).toBeInTheDocument();
    expect(screen.getByText('1 file')).toBeInTheDocument();
    expect(screen.getByText('Linguists meet visitors.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fix match' })).toBeInTheDocument();
    expect(screen.getByText('The tabs')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTitleHero.displayName).toBe('MediaTitleHero');
  });
});
