import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnimeSettingsCard } from './AnimeSettingsCard';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';

const ANIME: AnimeFacts = {
  anilistId: 1,
  malId: null,
  names: { english: 'Show', romaji: 'Shou', native: null, others: [] },
  cours: [],
  episodes: [],
  courSource: 'group',
  groupId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  groups: [{ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Arcs', groupCount: 3 }],
  films: [],
};

const props = () => ({
  anime: ANIME,
  animeAudio: null,
  profileAudio: 'subbed' as const,
  preferredGroup: null,
  courOrder: 'auto' as const,
  films: [
    { title: 'Show the Film', year: 2022, titleKey: 'film:55' },
    { title: 'Show the Other Film', year: null, titleKey: null },
  ],
  isBusy: false,
  onChangeAudio: vi.fn(),
  onChangeGroup: vi.fn(),
  onChangeCourOrder: vi.fn(),
  onOpenTitle: vi.fn(),
});

describe('AnimeSettingsCard', () => {
  it('chooses the speech, or its profile’s', async () => {
    const user = userEvent.setup();
    const given = props();

    render(<AnimeSettingsCard {...given} />);

    await user.click(screen.getByRole('button', { name: /Speech/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dual audio' }));

    expect(given.onChangeAudio).toHaveBeenCalledWith('dual');
  });

  it('keeps the show to a release group', async () => {
    const user = userEvent.setup();
    const given = props();

    render(<AnimeSettingsCard {...given} />);

    await user.type(screen.getByRole('textbox', { name: 'Release group' }), 'Group');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(given.onChangeGroup).toHaveBeenCalledWith('Group');
  });

  it('works its cours out by an episode group chosen', async () => {
    const user = userEvent.setup();
    const given = props();

    render(<AnimeSettingsCard {...given} />);

    await user.click(screen.getByRole('button', { name: /Cours/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /“Arcs” episode group/ }));

    expect(given.onChangeCourOrder).toHaveBeenCalledWith('group:aaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('says the names it is searched by, and opens its films', async () => {
    const user = userEvent.setup();
    const given = props();

    render(<AnimeSettingsCard {...given} />);

    expect(screen.getByText('Show · Shou')).toBeInTheDocument();
    expect(screen.getByText('Show the Other Film')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the Film (2022)' }));

    expect(given.onOpenTitle).toHaveBeenCalledWith('film:55');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnimeSettingsCard.displayName).toBe('AnimeSettingsCard');
  });
});
