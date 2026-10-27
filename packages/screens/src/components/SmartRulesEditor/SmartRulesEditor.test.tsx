import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { blankRule } from '@ValenceClient/smart/blankRule';
import { draftOfSongRules } from '@ValenceClient/smart/draftOfSongRules';
import { draftOfTitleRules } from '@ValenceClient/smart/draftOfTitleRules';
import { SmartRulesEditor } from './SmartRulesEditor';
import type { SmartDraft } from '@ValenceClient/smart/SmartDraft';

vi.mock('@ValenceClient/music/fetchMusicGenres', () => ({
  fetchMusicGenres: () => Promise.resolve(['Indie']),
}));

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () =>
    Promise.resolve({
      genres: ['Drama'],
      decades: [],
      maxRating: 10,
      audioLanguages: [],
      audioCodecs: [],
      audioChannels: [],
    }),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => Promise.resolve([]),
  fetchLibraryItems: () => Promise.resolve({ items: [], total: 0 }),
}));

/**
 * The editor holding its own rules, as a dialog would.
 *
 * @param props - What it edits and whether it has been checked.
 * @param props.of - Songs, or films and shows.
 * @param props.starts - The rules it starts with.
 * @param props.isChecked - Whether somebody has tried to save.
 * @returns The editor.
 */
const Held = ({
  of,
  starts,
  isChecked = false,
}: {
  of: 'songs' | 'titles';
  starts: SmartDraft;
  isChecked?: boolean;
}) => {
  const [draft, setDraft] = useState(starts);

  return <SmartRulesEditor of={of} draft={draft} isChecked={isChecked} onChange={setDraft} />;
};

describe('SmartRulesEditor', () => {
  it('says a playlist with no rules holds every song', () => {
    renderInAnAddress(<Held of="songs" starts={draftOfSongRules(null)} />);

    expect(
      screen.getByText('With no rules, it holds every song you can hear.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Holds' })).not.toBeInTheDocument();
  });

  it('adds a rule of a kind it does not have yet, and takes one away', async () => {
    renderInAnAddress(<Held of="songs" starts={draftOfSongRules(null)} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a rule' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add a rule' }));

    expect(screen.getAllByRole('button', { name: 'Remove this rule' })).toHaveLength(2);

    const [first] = screen.getAllByRole('button', { name: 'Remove this rule' });

    await userEvent.click(first ?? document.body);

    expect(screen.getAllByRole('button', { name: 'Remove this rule' })).toHaveLength(1);
  });

  it('asks a collection whether it holds films or shows', async () => {
    renderInAnAddress(<Held of="titles" starts={draftOfTitleRules(null)} />);

    expect(screen.getByRole('group', { name: 'Holds' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Shows' }));

    expect(
      screen.getByText('With no rules, it holds every film and show you can see.'),
    ).toBeInTheDocument();
  });

  it('says a runtime rule never holds a show', () => {
    renderInAnAddress(
      <Held
        of="titles"
        starts={{ ...draftOfTitleRules(null), holds: 'series', rules: [blankRule('runtime', 'k')] }}
      />,
    );

    expect(
      screen.getByText('Only films have a runtime, so shows never match this rule.'),
    ).toBeInTheDocument();
  });

  it('says which rules are unfinished once somebody has tried to save', () => {
    renderInAnAddress(
      <Held
        of="titles"
        isChecked
        starts={{ ...draftOfTitleRules(null), rules: [blankRule('released', 'k')] }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check the numbers in this rule, or remove it.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SmartRulesEditor.displayName).toBe('SmartRulesEditor');
  });
});
