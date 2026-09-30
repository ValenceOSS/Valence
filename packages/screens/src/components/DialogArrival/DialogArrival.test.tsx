import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogArrival } from './DialogArrival';

describe('DialogArrival', () => {
  it('draws the dialog content it is given', () => {
    render(
      <DialogArrival>
        <p>The rest of the dialog</p>
      </DialogArrival>,
    );

    expect(screen.getByText('The rest of the dialog')).toBeInTheDocument();
  });

  it('takes the caller layout', () => {
    const { container } = render(<DialogArrival className="flex flex-col">Content</DialogArrival>);

    expect(container.firstElementChild).toHaveClass('flex', 'flex-col');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogArrival.displayName).toBe('DialogArrival');
  });
});
