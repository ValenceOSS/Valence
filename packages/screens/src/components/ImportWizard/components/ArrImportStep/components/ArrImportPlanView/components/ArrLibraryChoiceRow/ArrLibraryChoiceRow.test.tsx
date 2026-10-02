import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArrLibraryChoiceRow } from './ArrLibraryChoiceRow';

const LIBRARY = {
  libraryId: 'films',
  libraryName: 'Films',
  libraryKind: 'movies' as const,
  appName: 'Radarr',
  appUrl: 'http://radarr:7878',
  rootFolders: ['/movies'],
  isGuessed: true,
  profileName: 'HD-1080p',
};

describe('ArrLibraryChoiceRow', () => {
  it('says that handing requests to the app is the default while it keeps running', () => {
    render(
      <ArrLibraryChoiceRow
        library={LIBRARY}
        choice="handOff"
        isDisabled={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Radarr keeps doing the downloading/)).toBeInTheDocument();
    expect(screen.getByText('Matched by its folder’s name only')).toBeInTheDocument();
  });

  it('says what Valence’s own downloader judges by, and offers each choice', async () => {
    const onChoose = vi.fn();

    render(
      <ArrLibraryChoiceRow
        library={LIBRARY}
        choice="takeOver"
        isDisabled={false}
        onChoose={onChoose}
      />,
    );

    expect(screen.getByText(/HD-1080p/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Leave as it is' }));

    expect(onChoose).toHaveBeenCalledWith('leave');
  });

  it('changes nothing while it is locked', async () => {
    const onChoose = vi.fn();

    render(<ArrLibraryChoiceRow library={LIBRARY} choice="leave" isDisabled onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Hand requests to Radarr' }));

    expect(onChoose).not.toHaveBeenCalled();
    expect(screen.getByText(/stays as it is/)).toBeInTheDocument();
  });
});
