import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocCallout } from '@ValenceDocs/components/DocCallout/DocCallout';

describe('DocCallout', () => {
  it('says its title and what it is about, spaced for the middle of a page', () => {
    render(
      <DocCallout title="No GPU?" tone="warning">
        <p>Delete the devices entry.</p>
      </DocCallout>,
    );

    const callout = screen.getByRole('alert');

    expect(callout).toHaveTextContent('No GPU?');
    expect(callout).toHaveTextContent('Delete the devices entry.');
    expect(callout).toHaveClass('my-6');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DocCallout.displayName).toBe('DocCallout');
  });
});
