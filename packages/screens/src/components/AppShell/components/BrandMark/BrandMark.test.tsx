import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandMark } from './BrandMark';

describe('BrandMark', () => {
  it('names Valence once to somebody listening', () => {
    render(<BrandMark hasMark marksPlace="valence-mark" />);

    expect(screen.getByText('Valence')).toHaveClass('sr-only');
  });

  it('writes the word beside the mark, letter by letter', () => {
    const { container } = render(<BrandMark hasMark marksPlace="valence-mark" />);

    const letters = [...container.querySelectorAll('span.inline-block')].filter(
      (letter) => letter.textContent !== '',
    );

    expect(letters.map((letter) => letter.textContent).join('')).toBe('Valence');
    expect(letters).toHaveLength('Valence'.length);
  });

  it('keeps the mark hidden where it is still on its way from elsewhere', () => {
    const { container } = render(<BrandMark hasMark={false} marksPlace="valence-mark" />);

    expect(container.querySelector('span.opacity-0')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandMark.displayName).toBe('BrandMark');
  });
});
