import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WayInMark } from './WayInMark';

describe('WayInMark', () => {
  it('draws Valence’s mark for a server that goes by Valence', () => {
    render(<WayInMark name="Valence" isSmall />);

    expect(screen.getByLabelText('Valence')).toBeInTheDocument();
  });

  it('spells out the name of a server that goes by another', () => {
    render(<WayInMark name="The Smiths’ Cinema" isSmall={false} />);

    expect(screen.getByText('The Smiths’ Cinema')).toBeInTheDocument();
  });
});
