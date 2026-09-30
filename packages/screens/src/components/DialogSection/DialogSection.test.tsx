import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { DialogSection } from './DialogSection';

describe('DialogSection', () => {
  it('names itself by its heading, and draws the heading inside', () => {
    render(<DialogSection heading="Synopsis">A story.</DialogSection>);

    expect(screen.getByRole('region', { name: 'Synopsis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Synopsis' })).toBeInTheDocument();
    expect(screen.getByText('A story.')).toBeInTheDocument();
  });

  it('leaves the heading to content that brings its own', () => {
    render(
      <DialogSection>
        <h3>Cast 12</h3>
      </DialogSection>,
    );

    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('is simply there outside a stack of sections, whatever is animating around it', () => {
    const { container } = render(<DialogSection heading="Details">Released 2024</DialogSection>);

    expect(container.querySelector('section')?.getAttribute('style') ?? '').not.toContain(
      'opacity',
    );
  });

  it('takes its turn arriving inside a stack of sections', () => {
    render(
      <DialogSections>
        <DialogSection heading="Synopsis">A story.</DialogSection>
      </DialogSections>,
    );

    expect(screen.getByRole('region', { name: 'Synopsis' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogSection.displayName).toBe('DialogSection');
  });
});
