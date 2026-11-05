import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TitlePeople } from './TitlePeople';
import type { TitleEditRequest } from '@ValenceContracts/schemas/TitleEdit';

const { read, edit, people } = vi.hoisted(() => ({
  read: vi.fn(),
  edit: vi.fn<(mediaId: string, scope: string, request: TitleEditRequest) => Promise<object>>(),
  people: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchTitleMetadata', () => ({
  fetchTitleMetadata: read,
  editTitleMetadata: edit,
  undoTitleChange: vi.fn(),
  fetchTitleHistory: vi.fn(),
}));
vi.mock('@ValenceClient/admin/findCataloguePeople', () => ({ findCataloguePeople: people }));

const FIRST = { personId: 1, name: 'First Person', role: 'Lead', imageUrl: null };
const SECOND = { personId: 2, name: 'Second Person', role: 'Friend', imageUrl: null };

const METADATA = {
  subject: { kind: 'film', key: 'movie:1', libraryId: 'lib', isMatched: true },
  fields: { cast: { value: [FIRST, SECOND], source: 'catalogue', catalogue: [FIRST, SECOND] } },
};

/**
 * The cast the last edit asked to save.
 *
 * @returns The cast.
 */
const savedCast = () => edit.mock.calls.at(-1)?.[2].set;

beforeEach(() => {
  read.mockReset().mockResolvedValue(METADATA);
  edit
    .mockReset()
    .mockResolvedValue({ kind: 'saved', outcome: { changeSetId: 's', metadata: METADATA } });
  people
    .mockReset()
    .mockResolvedValue([{ personId: 3, name: 'Third Person', imageUrl: null, knownFor: 'A film' }]);
});

describe('TitlePeople', () => {
  it('lists the cast in billing order, with each part', async () => {
    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });

    expect(await screen.findByText('First Person')).toBeInTheDocument();
    expect(screen.getByLabelText('First Person’s role')).toHaveValue('Lead');
    expect(screen.getByRole('button', { name: 'Move First Person up' })).toBeDisabled();
  });

  it('moves somebody down the billing, and takes somebody off', async () => {
    const user = userEvent.setup();

    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });
    await user.click(await screen.findByRole('button', { name: 'Move First Person down' }));

    await waitFor(() => {
      expect(savedCast()).toEqual({ cast: [SECOND, FIRST] });
    });

    await user.click(screen.getByRole('button', { name: 'Take Second Person off the cast' }));

    await waitFor(() => {
      expect(savedCast()).toEqual({ cast: [FIRST] });
    });
  });

  it('moves somebody to the top of the billing', async () => {
    const user = userEvent.setup();

    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });
    await user.click(await screen.findByRole('button', { name: 'Move Second Person to the top' }));

    await waitFor(() => {
      expect(savedCast()).toEqual({ cast: [SECOND, FIRST] });
    });
    expect(screen.getByRole('button', { name: 'Move First Person to the top' })).toBeDisabled();
  });

  it('changes a part once typing is done', async () => {
    const user = userEvent.setup();

    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });

    const role = await screen.findByLabelText('Second Person’s role');

    await user.clear(role);
    await user.type(role, 'Rival{Enter}');

    await waitFor(() => {
      expect(savedCast()).toEqual({ cast: [FIRST, { ...SECOND, role: 'Rival' }] });
    });
  });

  it('adds somebody from the catalogue, or by name alone', async () => {
    const user = userEvent.setup();

    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });
    await user.type(await screen.findByLabelText('Add a person'), 'Third');
    await user.click(await screen.findByRole('button', { name: 'Add Third Person to the cast' }));

    await waitFor(() => {
      expect(savedCast()).toEqual({
        cast: [FIRST, SECOND, { personId: 3, name: 'Third Person', role: '', imageUrl: null }],
      });
    });

    await user.type(screen.getByLabelText('Add a person'), 'Nobody known');
    await user.click(
      await screen.findByRole('button', { name: 'Add “Nobody known” by name only' }),
    );

    await waitFor(() => {
      expect(savedCast()).toEqual({
        cast: [FIRST, SECOND, { personId: null, name: 'Nobody known', role: '', imageUrl: null }],
      });
    });
  });

  it('puts the search away with Escape or Cancel', async () => {
    const user = userEvent.setup();

    render(<TitlePeople mediaId="a" />, { wrapper: CacheScope });
    await user.type(await screen.findByLabelText('Add a person'), 'Third');
    await screen.findByRole('button', { name: 'Add Third Person to the cast' });
    await user.keyboard('{Escape}');

    expect(screen.getByLabelText('Add a person')).toHaveValue('');

    await user.type(screen.getByLabelText('Add a person'), 'Third');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(screen.getByLabelText('Add a person')).toHaveValue('');
  });
});
