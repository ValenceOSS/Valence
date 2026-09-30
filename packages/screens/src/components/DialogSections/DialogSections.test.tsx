import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { DialogSections } from './DialogSections';
import { IsInDialogSections } from './IsInDialogSections';

const Tells = () => <p>{useContext(IsInDialogSections) ? 'inside' : 'outside'}</p>;

describe('DialogSections', () => {
  it('draws the sections it is given', () => {
    render(
      <DialogSections>
        <p>Synopsis</p>
        <p>Cast</p>
      </DialogSections>,
    );

    expect(screen.getByText('Synopsis')).toBeInTheDocument();
    expect(screen.getByText('Cast')).toBeInTheDocument();
  });

  it('tells the sections inside it that they are arriving in turn', () => {
    render(
      <DialogSections>
        <Tells />
      </DialogSections>,
    );

    expect(screen.getByText('inside')).toBeInTheDocument();
  });

  it('tells nothing outside it', () => {
    render(<Tells />);

    expect(screen.getByText('outside')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DialogSections.displayName).toBe('DialogSections');
  });
});
