import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { NewCollectionButton } from './NewCollectionButton';

const held = vi.hoisted(() => ({ mayEdit: false, hasSmart: true }));

vi.mock('@ValenceClient/about/useServerHas', () => ({ useServerHas: () => held.hasSmart }));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({
    may: (permission: string) => permission === 'library.edit' && held.mayEdit,
    mayAdminister: false,
    isLoading: false,
  }),
}));

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () =>
    Promise.resolve({
      genres: [],
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

beforeEach(() => {
  held.mayEdit = false;
  held.hasSmart = true;
});

describe('NewCollectionButton', () => {
  it('starts a smart collection for somebody who does not look after the libraries', async () => {
    renderInAnAddress(<NewCollectionButton holds="film" onMade={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'New collection' }));

    expect(await screen.findByRole('dialog', { name: 'New smart collection' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Smart collection' })).not.toBeInTheDocument();
  });

  it('lets somebody who looks after the libraries choose a collection filled by hand', async () => {
    held.mayEdit = true;
    renderInAnAddress(<NewCollectionButton holds="film" onMade={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'New collection' }));
    await userEvent.click(await screen.findByRole('switch', { name: 'Smart collection' }));

    expect(await screen.findByRole('dialog', { name: 'New collection' })).toBeInTheDocument();
  });

  it('says nothing to somebody who can make neither kind', () => {
    held.hasSmart = false;

    const { container } = renderInAnAddress(<NewCollectionButton holds="film" onMade={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NewCollectionButton.displayName).toBe('NewCollectionButton');
  });
});
