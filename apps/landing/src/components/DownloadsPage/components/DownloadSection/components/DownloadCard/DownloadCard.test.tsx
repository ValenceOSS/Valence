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

  it('lifts the one this visitor most likely came for', () => {
    render(
      <DownloadCard eyebrow="Phones" title="Phones" glyph={IconBrandDocker} index={0} isLit>
        <span />
      </DownloadCard>,
    );

    expect(screen.getByRole('article', { name: 'Phones' })).toHaveClass('ring-1');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadCard.displayName).toBe('DownloadCard');
  });
});
