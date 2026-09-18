import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookText } from './BookText';

/**
 * Draws a part of a book.
 */
const draw = (html: string, onFollow = vi.fn()) => {
  const drawn = render(<BookText html={html} onFollow={onFollow} />);

  return { ...drawn, onFollow };
};

describe('BookText', () => {
  it('draws the text of a part, as the book structured it', () => {
    draw('<h2>Chapter I.</h2><p>It is a truth <em>universally</em> acknowledged.</p>');

    expect(screen.getByRole('heading', { name: 'Chapter I.' })).toBeInTheDocument();
    expect(screen.getByText('universally').tagName).toBe('EM');
  });

  it('never runs anything the book says, even if the server let it through', () => {
    const { container } = draw(
      '<p onclick="alert(1)">Hello</p><script>window.ran = true</script><iframe src="x"></iframe>',
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('p')?.getAttribute('onclick')).toBeNull();
  });

  it('keeps the text of an element it will not draw', () => {
    draw('<marquee>Still words</marquee>');

    expect(screen.getByText('Still words')).toBeInTheDocument();
  });

  it('draws a picture this server serves', () => {
    draw('<img src="/api/books/b/chapters/c/resource?href=x.png" alt="Elizabeth">');

    expect(screen.getByRole('img', { name: 'Elizabeth' })).toHaveAttribute(
      'src',
      '/api/books/b/chapters/c/resource?href=x.png',
    );
  });

  it('draws no picture from anywhere else', () => {
    draw('<img src="https://tracker.example/pixel.png" alt="Pixel">');

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('moves the reader when a link within the book is followed', async () => {
    const { onFollow } = draw('<p><a href="#valence-part-2:note">See the note</a></p>');

    await userEvent.click(screen.getByRole('link', { name: 'See the note' }));

    expect(onFollow).toHaveBeenCalledWith({ part: 2, anchor: 'note' });
  });

  it('opens a link to the web somewhere else', () => {
    draw('<a href="https://www.gutenberg.org/">Project Gutenberg</a>');

    const link = screen.getByRole('link', { name: 'Project Gutenberg' });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('keeps the words of a link that leads nowhere it can go', () => {
    draw('<a href="javascript:alert(1)">Nowhere</a>');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Nowhere')).toBeInTheDocument();
  });

  it('keeps the ids a link inside the book points at', () => {
    const { container } = draw('<p id="note">A note.</p>');

    expect(container.querySelector('#note')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookText.displayName).toBe('BookText');
  });
});
