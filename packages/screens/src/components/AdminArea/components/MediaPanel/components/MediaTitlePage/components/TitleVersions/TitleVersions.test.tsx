import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { TitleVersions } from './TitleVersions';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';

const { choosing } = vi.hoisted(() => ({ choosing: vi.fn(() => Promise.resolve(null)) }));

vi.mock('@ValenceClient/admin/chooseVersion', () => ({ chooseVersion: choosing }));

/**
 * One version of a film, as the title page lists it.
 *
 * @param id - Its file.
 * @param label - What it is called.
 * @returns The version.
 */
const aVersion = (id: string, label: string | null): MediaTitle => ({
  id: `edition ${id}`,
  libraryId: 'lib',
  kind: 'version',
  name: label ?? 'Original',
  order: id,
  year: null,
  lead: { ...aMediaSummary({ id }), versionLabel: label },
  episodes: [],
  parts: [],
  seasons: 0,
  sizeBytes: null,
  addedAt: '2026-01-01T00:00:00.000Z',
  posterFrom: null,
  isMatched: true,
});

const PATHS = { one: '/films/A/a.mkv', two: '/films/A/a.extended.mkv' };

describe('TitleVersions', () => {
  it('names a version once typing is done, and makes another play by default', async () => {
    const user = userEvent.setup();

    render(
      <TitleVersions
        versions={[aVersion('one', null), aVersion('two', 'Extended')]}
        paths={PATHS}
      />,
      { wrapper: CacheScope },
    );

    expect(screen.getByText('Plays by default')).toBeInTheDocument();

    const name = screen.getByLabelText('Name of a.extended.mkv');

    await user.clear(name);
    await user.type(name, 'Extended Cut{Enter}');

    await waitFor(() => {
      expect(choosing).toHaveBeenCalledWith('two', { label: 'Extended Cut' });
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play this by default' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Play this by default' }));

    await waitFor(() => {
      expect(choosing).toHaveBeenCalledWith('two', { isStanding: true });
    });
  });

  it('splits a version off through Fix match for that file alone', async () => {
    const onSplit = vi.fn();
    const user = userEvent.setup();
    const extended = aVersion('two', 'Extended');

    render(
      <TitleVersions
        versions={[aVersion('one', null), extended]}
        paths={PATHS}
        onSplit={onSplit}
      />,
      {
        wrapper: CacheScope,
      },
    );
    await user.click(
      screen.getByRole('button', { name: 'Split a.extended.mkv off as a film of its own' }),
    );

    expect(onSplit).toHaveBeenCalledWith(extended);
  });
});
