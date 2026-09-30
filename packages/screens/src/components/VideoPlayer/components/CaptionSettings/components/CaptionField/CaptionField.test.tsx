import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaptionField } from './CaptionField';

describe('CaptionField', () => {
  it('names the setting and draws its control underneath', () => {
    render(
      <CaptionField label="Size" value="100%">
        <input aria-label="Caption size" />
      </CaptionField>,
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByLabelText('Caption size')).toBeInTheDocument();
  });

  it('leaves the answer out where the control already says it', () => {
    const { container } = render(
      <CaptionField label="Font">
        <span />
      </CaptionField>,
    );

    expect(container.querySelectorAll('.text-text-muted')).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CaptionField.displayName).toBe('CaptionField');
  });
});
