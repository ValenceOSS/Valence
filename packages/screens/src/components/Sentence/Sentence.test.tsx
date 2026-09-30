import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sentence } from './Sentence';

describe('Sentence', () => {
  it('puts each filling in its gap, between the words around it', () => {
    const { container } = render(
      <Sentence
        words="common.list.andAlso"
        fillings={{ first: <strong>Stalled</strong>, rest: <em>no seeds</em> }}
      />,
    );

    expect(container).toHaveTextContent('Stalled; no seeds');
    expect(screen.getByText('Stalled').tagName).toBe('STRONG');
    expect(screen.getByText('no seeds').tagName).toBe('EM');
  });

  it('says a count in the form for that many, with the number where it goes', () => {
    const { container, rerender } = render(
      <Sentence counted="common.count.songs" count={1} fillings={{ count: <b>1</b> }} />,
    );

    expect(container).toHaveTextContent('1 song');

    rerender(<Sentence counted="common.count.songs" count={12} fillings={{ count: <b>12</b> }} />);

    expect(container).toHaveTextContent('12 songs');
    expect(screen.getByText('12').tagName).toBe('B');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Sentence.displayName).toBe('Sentence');
  });
});
