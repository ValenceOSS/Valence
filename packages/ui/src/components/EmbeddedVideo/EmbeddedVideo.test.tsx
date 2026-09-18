import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbeddedVideo } from './EmbeddedVideo';

describe('EmbeddedVideo', () => {
  it('frames what it was pointed at, named for anybody who cannot see it', () => {
    render(<EmbeddedVideo label="Arrival, the trailer" src="https://elsewhere/embed/abc" />);

    const framed = screen.getByTitle('Arrival, the trailer');

    expect(framed).toHaveAttribute('src', 'https://elsewhere/embed/abc');
  });

  it('gives the page it frames no way to reach back into this one', () => {
    render(<EmbeddedVideo label="A trailer" src="https://elsewhere/embed/abc" />);

    const sandbox = screen.getByTitle('A trailer').getAttribute('sandbox') ?? '';

    expect(sandbox.split(' ')).toEqual([
      'allow-scripts',
      'allow-same-origin',
      'allow-presentation',
    ]);
  });

  it('hands over no more of where the viewer came from than the site they came from', () => {
    render(<EmbeddedVideo label="A trailer" src="https://elsewhere/embed/abc" />);

    expect(screen.getByTitle('A trailer')).toHaveAttribute('referrerpolicy', 'strict-origin');
  });

  it('takes the layout its caller asks for', () => {
    render(
      <EmbeddedVideo label="A trailer" src="https://elsewhere/embed/abc" className="rounded-xl" />,
    );

    expect(screen.getByTitle('A trailer')).toHaveClass('rounded-xl');
  });
});
