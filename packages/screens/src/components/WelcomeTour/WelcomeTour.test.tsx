import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TOUR_STOPS } from '@ValenceScreens/tour/tourStops';
import { WelcomeTour } from './WelcomeTour';

const draw = (overrides: Partial<Parameters<typeof WelcomeTour>[0]> = {}) => {
  const onGoTo = vi.fn();
  const onFinished = vi.fn();

  render(
    <WelcomeTour isOpen name="Valence" onGoTo={onGoTo} onFinished={onFinished} {...overrides} />,
  );

  return { onGoTo, onFinished };
};

describe('WelcomeTour', () => {
  it('greets the newcomer by the name of the place and starts at home', () => {
    const { onGoTo } = draw();

    expect(screen.getByRole('dialog', { name: 'Welcome to Valence' })).toBeInTheDocument();
    expect(onGoTo).toHaveBeenCalledWith('home');
  });

  it('says how far through it is', () => {
    draw();

    expect(screen.getByText(`1 of ${TOUR_STOPS.length.toString()}`)).toBeInTheDocument();
  });

  it('shows the next place, and the page behind it, when asked to go on', async () => {
    const { onGoTo } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onGoTo).toHaveBeenLastCalledWith(TOUR_STOPS[1]?.section);
    expect(screen.getByText(`2 of ${TOUR_STOPS.length.toString()}`)).toBeInTheDocument();
  });

  it('goes back a step', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText(`1 of ${TOUR_STOPS.length.toString()}`)).toBeInTheDocument();
  });

  it('offers no way back from the first step', () => {
    draw();

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('can be skipped from the first step, and puts the page back at home', async () => {
    const { onFinished, onGoTo } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }));

    expect(onFinished).toHaveBeenCalledOnce();
    expect(onGoTo).toHaveBeenLastCalledWith('home');
  });

  it('is finished by the last step', async () => {
    const { onFinished } = draw();

    for (let step = 1; step < TOUR_STOPS.length; step += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    }

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(onFinished).toHaveBeenCalledOnce();
  });

  it('shows nothing while it is not open', () => {
    draw({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WelcomeTour.displayName).toBe('WelcomeTour');
  });
});
