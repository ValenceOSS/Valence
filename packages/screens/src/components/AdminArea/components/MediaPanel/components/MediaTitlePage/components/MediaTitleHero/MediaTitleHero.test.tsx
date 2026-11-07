import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaTitleHero } from './MediaTitleHero';

describe('MediaTitleHero', () => {
  it('names the title in large type with its year, each fact once, its actions, and the tabs above what they switch between', () => {
    render(
      <MediaTitleHero
        name="Arrival"
        aside="2016"
        posterUrl={null}
        badges={<span>4K</span>}
        facts={[
          { label: 'Library', value: 'Films' },
          { label: 'Files', value: '1' },
        ]}
        actions={<button type="button">Fix match</button>}
        tabs={<span>The tabs</span>}
      >
        <p>What the tabs show</p>
      </MediaTitleHero>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arrival2016');
    expect(screen.getByText('4K')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Films')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fix match' })).toBeInTheDocument();
    expect(
      screen.getByText('The tabs').compareDocumentPosition(screen.getByText('What the tabs show')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTitleHero.displayName).toBe('MediaTitleHero');
  });
});
