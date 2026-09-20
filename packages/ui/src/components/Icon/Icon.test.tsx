import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home as HomeIcon, Pause as PauseIcon, Play as PlayIcon } from '@keyline-icons/react';
import { Home as HomeFilledIcon } from '@keyline-icons/react/fill';
import { Icon } from './Icon';

/**
 * The drawing an icon rendered as.
 *
 * @param container - What was rendered.
 * @returns The drawing.
 */
const glyphOf = (container: HTMLElement): SVGSVGElement => {
  const glyph = container.querySelector('svg');

  if (glyph === null) {
    throw new Error('The icon drew nothing.');
  }

  return glyph;
};

describe('Icon', () => {
  it('draws the icon it was given', () => {
    const { container } = render(<Icon of={HomeIcon} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('is hidden from anything reading the page, since a glyph beside a label says nothing', () => {
    const { container } = render(<Icon of={HomeIcon} />);

    expect(glyphOf(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('says what it means where it stands on its own', () => {
    render(<Icon of={HomeIcon} label="Home" />);

    expect(screen.getByRole('img', { name: 'Home' })).toBeInTheDocument();
  });

  it('takes the size it is asked for, in rem, so it grows with the text on a large screen', () => {
    const { container } = render(<Icon of={HomeIcon} size={32} />);

    expect(glyphOf(container)).toHaveAttribute('width', '2rem');
    expect(glyphOf(container)).toHaveAttribute('height', '2rem');
  });

  it('draws at the size of body text where no size is asked for', () => {
    const { container } = render(<Icon of={HomeIcon} />);

    expect(glyphOf(container)).toHaveAttribute('width', '1.125rem');
  });

  it('draws a filled twin while a thing is in force', () => {
    const { container: quiet } = render(<Icon of={HomeIcon} whenActive={HomeFilledIcon} />);
    const { container: loud } = render(<Icon of={HomeIcon} whenActive={HomeFilledIcon} isActive />);

    expect(quiet.innerHTML).not.toBe(loud.innerHTML);
  });

  it('draws the same line in force as at rest where it was given no twin', () => {
    const { container: quiet } = render(<Icon of={HomeIcon} />);
    const { container: loud } = render(<Icon of={HomeIcon} isActive />);

    expect(quiet.innerHTML).toBe(loud.innerHTML);
  });

  it('carries the class the stylesheet knows every glyph by', () => {
    const { container } = render(<Icon of={HomeIcon} />);

    expect(glyphOf(container)).toHaveClass('valence-icon');
  });

  it('keeps the classes a caller gave it as well', () => {
    const { container } = render(<Icon of={HomeIcon} className="text-red-500" />);

    expect(glyphOf(container)).toHaveClass('valence-icon', 'text-red-500');
  });

  it('draws the other icon instead while what it stands for is in force', () => {
    const { container: off } = render(<Icon of={PlayIcon} whenActive={PauseIcon} />);
    const { container: on } = render(<Icon of={PlayIcon} whenActive={PauseIcon} isActive />);
    const { container: pause } = render(<Icon of={PauseIcon} isActive />);

    expect(off.innerHTML).not.toBe(on.innerHTML);
    expect(on.querySelector('path')?.getAttribute('d')).toBe(
      pause.querySelector('path')?.getAttribute('d'),
    );
  });

  it('swaps the drawing in place rather than drawing the two side by side', () => {
    const { container } = render(<Icon of={PlayIcon} whenActive={PauseIcon} isActive />);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('takes the colour of the text around it unless it is given a tone', () => {
    const { container } = render(<Icon of={HomeIcon} />);

    expect(glyphOf(container)).not.toHaveClass('text-text-muted', 'text-danger');
  });

  it('draws in the muted or the danger colour when given that tone', () => {
    const { container } = render(
      <>
        <Icon of={HomeIcon} tone="muted" />
        <Icon of={PlayIcon} tone="danger" />
      </>,
    );

    const [muted, danger] = container.querySelectorAll('svg');

    expect(muted).toHaveClass('text-text-muted');
    expect(danger).toHaveClass('text-danger');
  });

  it('draws in the strong or the faint colour when given those tones', () => {
    const { container } = render(
      <>
        <Icon of={HomeIcon} tone="strong" />
        <Icon of={PlayIcon} tone="faint" />
      </>,
    );

    const [strong, faint] = container.querySelectorAll('svg');

    expect(strong).toHaveClass('text-text');
    expect(faint).toHaveClass('text-text-muted/60');
  });

  it('draws in the pale of text over a picture when given the scrim tone', () => {
    const { container } = render(<Icon of={HomeIcon} tone="scrim" />);

    expect(container.firstElementChild).toHaveClass('text-on-scrim');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Icon.displayName).toBe('Icon');
  });
});
