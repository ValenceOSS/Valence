import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CatalogueIdRow } from './CatalogueIdRow';

describe('CatalogueIdRow', () => {
  it('writes a matched title’s TMDB id plainly, links to it, and fixes the match', async () => {
    const onFixMatch = vi.fn();

    render(<CatalogueIdRow subjectKey="tv:1399" isShow onFixMatch={onFixMatch} />);

    expect(screen.getByText('1399')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open on TMDB' })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/tv/1399',
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Fix match' }));

    expect(onFixMatch).toHaveBeenCalled();
  });

  it('says an unmatched title is not matched yet, with nothing to open', () => {
    render(<CatalogueIdRow subjectKey="file:/films/A.mkv" isShow={false} />);

    expect(screen.getByText('Not matched yet')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CatalogueIdRow.displayName).toBe('CatalogueIdRow');
  });
});
