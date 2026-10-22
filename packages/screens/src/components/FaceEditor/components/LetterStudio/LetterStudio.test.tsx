import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LetterStudio } from './LetterStudio';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

describe('LetterStudio', () => {
  it('shows every font setting the first letter of the name, marking the one in use', () => {
    render(
      <LetterStudio
        name="marques"
        colour="#3a8ee8"
        font={PLUS_JAKARTA_SANS_AS_STORED}
        onColour={vi.fn()}
        onFont={vi.fn()}
      />,
    );

    const current = screen.getByRole('button', { name: 'Set it in Plus Jakarta Sans' });

    expect(current).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('M').length).toBeGreaterThan(1);
  });

  it('says which font was chosen', async () => {
    const onFont = vi.fn();

    render(
      <LetterStudio
        name="Marques"
        colour="#3a8ee8"
        font={PLUS_JAKARTA_SANS_AS_STORED}
        onColour={vi.fn()}
        onFont={onFont}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Set it in Manrope' }));

    expect(onFont).toHaveBeenCalledWith('manrope');
  });
});
