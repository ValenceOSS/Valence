import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is a switch to anything reading the page', () => {
    render(<Switch label="Subtitles" isOn={false} onToggle={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Subtitles' })).toBeInTheDocument();
  });

  it('says whether it is on, rather than only looking it', () => {
    render(<Switch label="Subtitles" isOn onToggle={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Subtitles' })).toBeChecked();
  });

  it('says when it is off', () => {
    render(<Switch label="Subtitles" isOn={false} onToggle={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Subtitles' })).not.toBeChecked();
  });

  it('toggles when pressed', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Switch label="Subtitles" isOn={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('switch', { name: 'Subtitles' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('toggles from the keyboard, which is the point of not hand-rolling it', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Switch label="Subtitles" isOn={false} onToggle={onToggle} />);

    await user.tab();
    await user.keyboard(' ');

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('does nothing when disabled', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Switch label="Subtitles" isOn={false} onToggle={onToggle} disabled />);

    await user.click(screen.getByRole('switch', { name: 'Subtitles' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows an icon beside the label without taking its name from it', () => {
    render(
      <Switch
        label="Subtitles"
        isOn={false}
        onToggle={vi.fn()}
        icon={<span data-testid="glyph" aria-hidden />}
      />,
    );

    expect(screen.getByTestId('glyph')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Subtitles' })).toBeInTheDocument();
  });

  it('paints itself for a panel over video when asked', () => {
    const { container } = render(
      <Switch label="Subtitles" isOn onToggle={vi.fn()} tone="overlay" />,
    );

    expect(container.querySelector('.bg-on-scrim')).toBeInTheDocument();
  });

  it('takes its track from the theme where it is not over video, in white rather than blue', () => {
    const { container } = render(<Switch label="Subtitles" isOn onToggle={vi.fn()} />);

    expect(container.querySelector('.bg-text')).toBeInTheDocument();
    expect(container.querySelector('.bg-accent')).not.toBeInTheDocument();
  });

  it('draws the knob in the grey a button is filled with when on, so on reads as the reverse of off', () => {
    const { container } = render(<Switch label="Subtitles" isOn onToggle={vi.fn()} />);

    expect(container.querySelector('[role="switch"] [data-state="checked"]')).toHaveClass(
      'bg-[color-mix(in_oklab,var(--color-text)_10%,var(--color-surface))]',
    );
  });

  it('carries the same border a button does', () => {
    const { container } = render(<Switch label="Subtitles" isOn={false} onToggle={vi.fn()} />);

    expect(container.querySelector('[role="switch"] > span:last-child')).toHaveClass(
      'border',
      'border-[var(--surface-line)]',
    );
  });

  it('points to text elsewhere that explains it, such as a note beside a hidden label', () => {
    render(
      <>
        <p id="note">Rate-limited attempts are refused before they reach this.</p>
        <Switch
          label="Sign-in refused"
          isLabelHidden
          isOn={false}
          onToggle={vi.fn()}
          describedBy="note"
        />
      </>,
    );

    expect(screen.getByRole('switch', { name: 'Sign-in refused' })).toHaveAccessibleDescription(
      'Rate-limited attempts are refused before they reach this.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Switch.displayName).toBe('Switch');
  });

  it('keeps its knob through a flip, rather than drawing a new one', () => {
    const { rerender } = render(<Switch label="Trailers" isOn={false} onToggle={vi.fn()} />);

    rerender(<Switch label="Trailers" isOn onToggle={vi.fn()} />);

    const knob = screen.getByRole('switch', { name: 'Trailers' }).querySelector('[data-state]');

    expect(knob).not.toBeNull();
  });
});
