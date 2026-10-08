import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RequirementsPage } from './RequirementsPage';

describe('RequirementsPage', () => {
  it('names the page', () => {
    render(<RequirementsPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What kind of');
  });

  it('sets out every point the page makes', () => {
    render(<RequirementsPage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Start with Docker compose' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RequirementsPage.displayName).toBe('RequirementsPage');
  });
});
