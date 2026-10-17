import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { MagnetForm } from './MagnetForm';

const pickMediaRelease = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({ pickMediaRelease }));

const HASH = 'd058be67d8eaae6880a434600d2131684cddf85b';

const HARUHI = aMediaRequest({ kind: 'series', title: 'The Melancholy of Haruhi Suzumiya' });

/**
 * Opens the form for a season of Haruhi and pastes the link given.
 */
const pasting = async (magnet: string, onPicked = vi.fn()) => {
  const user = userEvent.setup();

  renderInAnAddress(
    <MagnetForm request={HARUHI} scope={{ season: 1, episode: null }} onPicked={onPicked} />,
  );
  await user.click(screen.getByRole('button', { name: 'Add a magnet link' }));
  await user.click(screen.getByRole('textbox', { name: 'Magnet link' }));
  await user.paste(magnet);

  return user;
};

describe('MagnetForm', () => {
  it('downloads a pasted link under the name it carries, and says it is on its way', async () => {
    const onPicked = vi.fn();

    pickMediaRelease.mockResolvedValue({ value: HARUHI, refusal: null });

    const user = await pasting(
      `magnet:?xt=urn:btih:${HASH}&dn=The%20Melancholy%20of%20Haruhi%20Suzumiya%20Season%201`,
      onPicked,
    );

    expect(screen.getByRole('textbox', { name: 'What it holds' })).toHaveValue(
      'The Melancholy of Haruhi Suzumiya Season 1',
    );

    await user.click(screen.getByRole('button', { name: 'Download it' }));

    await waitFor(() => {
      expect(onPicked).toHaveBeenCalledWith(HARUHI);
    });
    expect(pickMediaRelease).toHaveBeenCalledWith(
      HARUHI.id,
      expect.objectContaining({
        title: 'The Melancholy of Haruhi Suzumiya Season 1',
        infoHash: HASH,
      }),
      false,
    );
  });

  it('names a link that carries no name by the season it was opened for', async () => {
    await pasting(`magnet:?xt=urn:btih:${HASH}`);

    expect(screen.getByRole('textbox', { name: 'What it holds' })).toHaveValue(
      'The Melancholy of Haruhi Suzumiya S01',
    );
  });

  it('says what is wrong with a link, and why the title would not take it', async () => {
    pickMediaRelease.mockResolvedValue({
      value: null,
      refusal: sayVerbatim('It holds no episode this title is waiting for'),
    });

    const user = await pasting('https://nyaa.si/view/1');

    await user.click(screen.getByRole('button', { name: 'Download it' }));

    expect(screen.getByText(/isn’t a magnet link/)).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Magnet link' }));
    await user.paste(`magnet:?xt=urn:btih:${HASH}`);
    await user.click(screen.getByRole('button', { name: 'Download it' }));

    expect(
      await screen.findByText('It holds no episode this title is waiting for'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MagnetForm.displayName).toBe('MagnetForm');
  });
});
