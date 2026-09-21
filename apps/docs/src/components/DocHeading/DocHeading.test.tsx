import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocHeading } from '@ValenceDocs/components/DocHeading/DocHeading';

describe('DocHeading', () => {
  it('renders the level it is given with a link to itself', () => {
    render(
      <DocHeading level={2} id="why">
        Why
      </DocHeading>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'why');
    expect(screen.getByRole('link', { name: 'Link to this section' })).toHaveAttribute(
      'href',
      '#why',
    );
  });

  it('has nothing to link where it has no anchor', () => {
    render(<DocHeading level={4}>Loose</DocHeading>);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
