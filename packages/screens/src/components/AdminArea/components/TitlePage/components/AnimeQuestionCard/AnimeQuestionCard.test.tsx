import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnimeQuestionCard } from './AnimeQuestionCard';
import type { AnimeQuestion } from '@ValenceContracts/schemas/Anime';

const QUESTION: AnimeQuestion = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  release: {
    id: 'r1',
    title: '[Group] Show S2 - 01 [1080p]',
    indexerId: 'i',
    indexerName: 'Indexer',
    protocol: 'torrent',
    sizeBytes: null,
    seeders: null,
    leechers: null,
    grabs: null,
    publishedAt: null,
    categories: [],
    downloadUrl: null,
    magnetUrl: null,
    infoUrl: null,
    infoHash: null,
    downloadFactor: null,
    uploadFactor: null,
    minimumRatio: null,
    minimumSeedSeconds: null,
  },
  group: 'Group',
  readings: [
    { numbering: 'aired', episodes: [{ season: 2, episode: 1 }] },
    { numbering: 'perCour', episodes: [{ season: 1, episode: 13 }] },
  ],
  guess: 'perCour',
  at: '2026-10-14T00:00:00.000Z',
};

describe('AnimeQuestionCard', () => {
  it('asks which episodes a release holds, its best guess marked', () => {
    render(
      <AnimeQuestionCard
        question={QUESTION}
        isBusy={false}
        onAnswer={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText('Which episode is this?')).toBeInTheDocument();
    expect(screen.getByText('[Group] Show S2 - 01 [1080p]')).toBeInTheDocument();
    expect(screen.getByText('Best guess')).toBeInTheDocument();
  });

  it('fetches it read the way chosen, remembering it for its release group unless told not to', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <AnimeQuestionCard
        question={QUESTION}
        isBusy={false}
        onAnswer={onAnswer}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /S01E13, numbered within each cour/ }));

    expect(onAnswer).toHaveBeenLastCalledWith('perCour', true);

    await user.click(screen.getByRole('checkbox', { name: /Read Group’s releases/ }));
    await user.click(screen.getByRole('button', { name: /S02E01, the catalogue’s numbering/ }));

    expect(onAnswer).toHaveBeenLastCalledWith('aired', false);
  });

  it('lets the question go', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <AnimeQuestionCard
        question={QUESTION}
        isBusy={false}
        onAnswer={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Don’t fetch it' }));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnimeQuestionCard.displayName).toBe('AnimeQuestionCard');
  });
});
