import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MusicHeader } from './MusicHeader';

describe('MusicHeader', () => {
  it('names what the page is about, as its heading', () => {
    render(<MusicHeader eyebrow="Album" title="Even In Arcadia" artwork={null} />);

    expect(screen.getByRole('heading', { name: 'Even In Arcadia' })).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument();
  });

  it('stands on the page rather than on a coloured panel of its own', () => {
    const { container } = render(<MusicHeader eyebrow="Album" title="x" artwork={null} />);

    expect(container.querySelector('header')?.getAttribute('style')).toBeNull();
  });

  it('draws the details and the buttons it is given', () => {
    render(
      <MusicHeader
        eyebrow="Album"
        title="x"
        artwork={null}

        details={<span>Sleep Token · 2025</span>}
        actions={<span>Play</span>}
      />,
    );

    expect(screen.getByText('Sleep Token · 2025')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicHeader.displayName).toBe('MusicHeader');
  });
});
