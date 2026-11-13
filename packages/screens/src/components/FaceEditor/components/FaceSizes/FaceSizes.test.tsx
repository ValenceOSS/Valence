import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FaceSizes } from './FaceSizes';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

describe('FaceSizes', () => {
  it('draws the face as a tile, in a list and in the bar, with no words beneath', () => {
    render(
      <FaceSizes
        name="Dan"
        colour="#3a8ee8"
        avatar={{ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED }}
        source="/api/profiles/p1/avatar"
        pending={null}
      />,
    );

    expect(screen.getAllByText('D')).toHaveLength(3);
    expect(screen.getByText('Dan')).toBeInTheDocument();
    expect(screen.queryByText('In a list')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceSizes.displayName).toBe('FaceSizes');
  });
});
