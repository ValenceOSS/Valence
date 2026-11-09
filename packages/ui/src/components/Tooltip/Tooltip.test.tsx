import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('says nothing until a pointer rests on the control', () => {
    render(
      <Tooltip label="Pop out">
        <button type="button">Pop out</button>
      </Tooltip>,
    );

    expect(screen.queryByText('Pop out', { selector: 'div' })).not.toBeInTheDocument();
  });

  it('names the control once a pointer has rested on it', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip label="Pop out">
        <button type="button" aria-label="Pop out" />
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Pop out' }));

    expect(await screen.findByText('Pop out')).toBeInTheDocument();
  });

  it('says more beneath the name, past a line, where it is given more to say', async () => {
    const user = userEvent.setup();
    const detail = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0';

    render(
      <Tooltip label="Firefox" detail={detail}>
        <button type="button" aria-label="Device" />
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Device' }));

    const said = (await screen.findAllByText(detail)).find(
      (found) => found.closest('[data-slot="tooltip-content"]') !== null,
    );
    const chip = said?.closest('[data-slot="tooltip-content"]');

    expect(chip).toHaveTextContent('Firefox');
    expect(said?.previousElementSibling).toHaveAttribute('aria-hidden');
    expect(said?.previousElementSibling).toHaveClass('h-px');
  });

  it('leaves the control exactly as its caller built it', () => {
    render(
      <Tooltip label="Pop out">
        <button type="button" className="the-caller-said-so">
          Pop out
        </button>
      </Tooltip>,
    );

    expect(screen.getByRole('button')).toHaveClass('the-caller-said-so');
  });

  it('draws the control and nothing else where it has been told to say nothing', () => {
    render(
      <Tooltip label="Pop out" isDisabled>
        <button type="button">Pop out</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is a small solid chip in the page colours turned over, rather than a pane of glass', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip label="Pop out">
        <button type="button" aria-label="Pop out" />
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Pop out' }));

    const chip = (await screen.findAllByText('Pop out'))
      .map((found) => found.closest('[data-slot="tooltip-content"]'))
      .find((found) => found !== null);

    expect(chip).toHaveClass('bg-text', 'text-surface', 'rounded-sm');
    expect(chip?.className).not.toContain('valence-glass');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Tooltip.displayName).toBe('Tooltip');
  });
});
