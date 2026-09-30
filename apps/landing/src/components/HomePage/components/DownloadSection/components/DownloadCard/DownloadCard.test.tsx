import { render, screen } from '@testing-library/react';
import { IconBrandDocker } from '@tabler/icons-react';
import { describe, expect, it } from 'vitest';
import { DownloadCard } from './DownloadCard';

describe('DownloadCard', () => {
  it('names itself, says what kind of thing it is, and holds what it offers', () => {
    render(
      <DownloadCard
        eyebrow="Your server"
        title="One compose file"
        glyph={IconBrandDocker}
        focus="75% 40%"
        index={1}
      >
        <p>Start it.</p>
      </DownloadCard>,
    );

    const card = screen.getByRole('article', { name: 'One compose file' });

    expect(card).toHaveTextContent('Your server');
    expect(screen.getByRole('heading', { name: 'One compose file' })).toBeInTheDocument();
    expect(screen.getByText('Start it.')).toBeInTheDocument();
  });

  it('draws its strip of the header picture lazily, sized, at the part asked for', () => {
    const { container } = render(
      <DownloadCard
        eyebrow="Phones"
        title="Phones"
        glyph={IconBrandDocker}
        focus="50% 20%"
        index={0}
      >
        <span />
      </DownloadCard>,
    );

    const picture = container.querySelector('img');

    expect(picture).toHaveAttribute('src', '/downloads-header.jpg');
    expect(picture).toHaveAttribute('loading', 'lazy');
    expect(picture).toHaveAttribute('decoding', 'async');
    expect(picture).toHaveAttribute('width', '2000');
    expect(picture).toHaveStyle({ objectPosition: '50% 20%' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadCard.displayName).toBe('DownloadCard');
  });
});
