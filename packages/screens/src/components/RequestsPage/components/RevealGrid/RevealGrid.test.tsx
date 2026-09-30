import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RevealGrid } from './RevealGrid';

describe('RevealGrid', () => {
  it('is a list named for what it holds, with the tiles it is given', () => {
    render(
      <RevealGrid label="Popular albums">
        <li>The Black Parade</li>
        <li>Danger Days</li>
      </RevealGrid>,
    );

    expect(screen.getByRole('list', { name: 'Popular albums' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RevealGrid.displayName).toBe('RevealGrid');
  });
});
