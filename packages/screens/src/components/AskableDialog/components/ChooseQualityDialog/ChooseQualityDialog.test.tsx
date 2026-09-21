import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChooseQualityDialog } from './ChooseQualityDialog';

const CHOICES = [
  { id: 'uhd', name: '4K', kind: 'video' as const },
  { id: 'hd', name: '1080p', kind: 'video' as const },
];

const draw = (overrides: { isAsking?: boolean } = {}) => {
  const handlers = { onChoose: vi.fn(), onClose: vi.fn() };

  render(
    <ChooseQualityDialog
      title="Dune"
      choices={CHOICES}
      isOpen
      isAsking={overrides.isAsking ?? false}
      {...handlers}
    />,
  );

  return handlers;
};

describe('ChooseQualityDialog', () => {
  it('names what is being asked for, and puts every quality in front of you', () => {
    draw();

    expect(screen.getByRole('heading', { name: 'Ask for Dune' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4K' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1080p' })).toBeInTheDocument();
  });

  it('asks at the quality tapped, without a second tap to confirm it', async () => {
    const { onChoose } = draw();

    await userEvent.click(screen.getByRole('button', { name: '1080p' }));

    expect(onChoose).toHaveBeenCalledWith('hd');
  });

  it('holds the qualities while one of them is being sent', () => {
    draw({ isAsking: true });

    expect(screen.getByRole('button', { name: '4K' })).toBeDisabled();
  });

  it('can be left without asking for anything', async () => {
    const { onClose, onChoose } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
    expect(onChoose).not.toHaveBeenCalled();
  });
});
