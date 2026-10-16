import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features/FEATURE_GROUPS';
import { FeaturesPage } from './FeaturesPage';

describe('FeaturesPage', () => {
  it('gives each area a table of its own, headed by its name', () => {
    render(<FeaturesPage />);

    for (const group of FEATURE_GROUPS) {
      expect(screen.getByRole('heading', { name: group.title, level: 2 })).toBeInTheDocument();
    }

    expect(screen.getAllByRole('table')).toHaveLength(FEATURE_GROUPS.length);
  });

  it('names each feature, says what it does and whether it is on from the start', () => {
    render(<FeaturesPage />);

    const row = screen.getByRole('row', { name: /Pre-transcoding/u });

    expect(within(row).getByText(/copies of each film ahead of time/u)).toBeInTheDocument();
    expect(within(row).getByText('No')).toBeInTheDocument();
    expect(within(row).getByText('Admin, Encoding')).toBeInTheDocument();
  });

  it('heads every table with the same three columns', () => {
    render(<FeaturesPage />);

    const [first] = screen.getAllByRole('table');

    const headers = within(first ?? document.body).getAllByRole('columnheader');

    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Feature');
    expect(headers[1]).toHaveTextContent('Description');
    expect(headers[2]).toHaveTextContent('Enabled by default');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeaturesPage.displayName).toBe('FeaturesPage');
  });
});
