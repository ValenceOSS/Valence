import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FaceChoice } from './FaceChoice';

describe('FaceChoice', () => {
  it('shows the face as the choice draws it, named, and says when it is chosen', async () => {
    const onChoose = vi.fn();

    render(
      <FaceChoice label="Use Noir" name="Noir" isChosen onChoose={onChoose}>
        <img src="/face.png" alt="" />
      </FaceChoice>,
    );

    expect(screen.getByText('Noir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Noir' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Use Noir' }));

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('is an empty circle that cannot be chosen while it is not available', () => {
    const { container } = render(
      <FaceChoice label="Use Noir" name="Noir" isChosen isDisabled onChoose={vi.fn()}>
        <img src="/face.png" alt="" />
      </FaceChoice>,
    );

    expect(screen.getByRole('button', { name: 'Use Noir' })).toBeDisabled();
    expect(container.querySelector('img')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceChoice.displayName).toBe('FaceChoice');
  });
});
