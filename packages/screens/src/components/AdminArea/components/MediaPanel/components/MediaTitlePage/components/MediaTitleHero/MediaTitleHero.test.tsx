import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaTitleHero } from './MediaTitleHero';

describe('MediaTitleHero', () => {
  it('names the title in large type with its year, each fact by what it is, actions and tabs', () => {
    render(
      <MediaTitleHero
        name="Arrival"
        year={2016}
        posterUrl={null}
        badges={<span>4K</span>}
        facts={[
          { label: 'Library', value: 'Films' },
          { label: 'Files', value: '1' },
        ]}
        actions={<button type="button">Fix match</button>}
        tabs={<span>The tabs</span>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arrival2016');
    expect(screen.getByText('4K')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getAllByText('Films')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Fix match' })).toBeInTheDocument();
    expect(screen.getByText('The tabs')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTitleHero.displayName).toBe('MediaTitleHero');
  });
});
