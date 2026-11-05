import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { FileDetails } from './FileDetails';

vi.mock('@ValenceClient/admin/fetchFolderMeasure', () => ({
  fetchFolderMeasure: () => Promise.resolve({ sizeBytes: 0, files: 0, folders: 0, isPartial: false }),
}));

const FILE = {
  name: 'A film.mkv',
  path: '/films/A film.mkv',
  isFolder: false,
  sizeBytes: 2048,
  modifiedAt: null,
  mediaId: null,
};

/**
 * Makes the screen as wide as asked, as a media query reads it.
 *
 * @param isWide - Whether it is wide enough for a pane beside the list.
 */
const screenIs = (isWide: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: isWide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
};

/**
 * Draws the details of what is chosen.
 *
 * @param selected - What is chosen.
 */
const draw = (selected: readonly (typeof FILE)[]) =>
  render(
    <FileDetails
      where={{ name: 'Films', path: '/films', holds: 1 }}
      selected={selected}
      shownPath={(path) => path}
      onClear={vi.fn()}
    />,
    { wrapper: CacheScope },
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FileDetails', () => {
  it('stands beside the list on a wide screen, saying what the folder holds', () => {
    screenIs(true);
    draw([]);

    expect(screen.getByRole('complementary', { name: 'Details' })).toBeInTheDocument();
  });

  it('shows on a phone only once something is chosen, under the list', () => {
    screenIs(false);

    const { rerender } = draw([]);

    expect(screen.queryByRole('complementary', { name: 'Details' })).not.toBeInTheDocument();

    rerender(
      <FileDetails
        where={{ name: 'Films', path: '/films', holds: 1 }}
        selected={[FILE]}
        shownPath={(path) => path}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('A film.mkv');
  });
});
