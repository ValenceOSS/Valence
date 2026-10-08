import { render, screen } from '@testing-library/react';
import { Play as PlayIcon } from '@keyline-icons/react/fill';
import { describe, expect, it } from 'vitest';
import { EditorialPage } from './EditorialPage';

const CARDS = [
  { title: 'Direct play wins', body: 'The server gets out of the way.', icon: PlayIcon },
  {
    title: 'Remux before re-encode',
    body: 'Change the container, keep the pixels.',
    icon: PlayIcon,
  },
];

const COMPARISONS = [{ label: 'Requests', valence: 'Built in.', others: 'A separate app.' }];

describe('EditorialPage', () => {
  it('leads with the title and the setup', () => {
    render(
      <EditorialPage
        eyebrow="Playback"
        title="Direct play first."
        description="How it plays."
        cards={CARDS}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Direct play first.');
    expect(screen.getByText('How it plays.')).toBeInTheDocument();
  });

  it('sets out every point as its own card', () => {
    render(<EditorialPage eyebrow="Playback" title="Title." description="Setup." cards={CARDS} />);

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Remux before re-encode' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Change the container, keep the pixels.')).toBeInTheDocument();
  });

  it('leaves the comparison out when there is nothing to compare', () => {
    render(<EditorialPage eyebrow="Playback" title="Title." description="Setup." cards={CARDS} />);

    expect(screen.queryByText('Where Valence is different.')).toBeNull();
  });

  it('sets Valence beside the typical alternative when asked to compare', () => {
    render(
      <EditorialPage
        eyebrow="Compare"
        title="Title."
        description="Setup."
        cards={CARDS}
        comparisons={COMPARISONS}
      />,
    );

    expect(screen.getByText('Where Valence is different.')).toBeInTheDocument();
    expect(screen.getByText('Built in.')).toBeInTheDocument();
    expect(screen.getByText('A separate app.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(EditorialPage.displayName).toBe('EditorialPage');
  });
});
