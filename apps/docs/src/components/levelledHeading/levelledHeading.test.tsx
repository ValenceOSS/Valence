import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { levelledHeading } from '@ValenceDocs/components/levelledHeading/levelledHeading';

describe('levelledHeading', () => {
  it('renders a heading of the level it was made for', () => {
    const Subheading = levelledHeading(3);

    render(<Subheading id="why">Why</Subheading>);

    expect(screen.getByRole('heading', { level: 3, name: /Why/ })).toHaveAttribute('id', 'why');
  });
});
