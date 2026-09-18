import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FinishOnAnotherDevice } from './FinishOnAnotherDevice';

describe('FinishOnAnotherDevice', () => {
  it('says which screen to go to, rather than only that this one is wrong', () => {
    render(<FinishOnAnotherDevice name="Valence" address="http://valence.local:8420" />);

    expect(screen.getByText('valence.local:8420')).toBeInTheDocument();
  });

  it('offers no way to carry on here, because there is not one', () => {
    render(<FinishOnAnotherDevice name="Valence" address="http://valence.local:8420" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('says it is waiting, so a screen with nothing on it is not read as stuck', () => {
    render(<FinishOnAnotherDevice name="Valence" address="http://valence.local:8420" />);

    expect(screen.getByLabelText('Waiting for you to finish')).toBeInTheDocument();
  });
});
