import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MACHINES } from '@ValenceLanding/content/requirements/MACHINES';
import { RequirementsPage } from './RequirementsPage';

describe('RequirementsPage', () => {
  it('names the page', () => {
    render(<RequirementsPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'What should run your Valence?',
    );
  });

  it('shows a card for every machine people run it on', () => {
    render(<RequirementsPage />);

    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length);
    expect(screen.getByRole('heading', { level: 3, name: 'An Intel mini PC' })).toBeInTheDocument();
  });

  it('says what a server needs', () => {
    render(<RequirementsPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'What a server needs.' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RequirementsPage.displayName).toBe('RequirementsPage');
  });
});
