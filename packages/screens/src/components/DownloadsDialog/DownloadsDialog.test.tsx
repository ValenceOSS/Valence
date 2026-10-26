import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { DownloadsDialog } from './DownloadsDialog';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ downloads: [] }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DownloadsDialog', () => {
  it('is shut when the address does not have it open', () => {
    renderInAnAddress(<DownloadsDialog isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says what it is', () => {
    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('says a kept file is the viewer’s, since that is the thing worth knowing about one', () => {
    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/stays until you delete it/)).toBeInTheDocument();
  });

  it('in a browser, says it is for seeing progress and offers no going offline', () => {
    installATestClient({ canKeepFiles: () => false });
    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/and their progress/)).toBeInTheDocument();
    expect(screen.queryByText('Go offline')).toBeNull();
  });

  it('shows what has been asked for', async () => {
    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(await screen.findByText(/No downloads yet/)).toBeInTheDocument();
  });

  it('lists the music and audiobooks this device keeps', async () => {
    installATestClient({ listeningFiles: aFakeListeningFiles().files });
    forgetTheKeptListening();
    await theKeptListening().keep(aKeptListening());

    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Music and audiobooks' })).toBeInTheDocument();
    expect(screen.getByText('Even In Arcadia')).toBeInTheDocument();
  });

  it('in a browser, lists no music or audiobooks, since none can be kept there', async () => {
    installATestClient({ canKeepFiles: () => false, listeningFiles: aFakeListeningFiles().files });
    forgetTheKeptListening();
    await theKeptListening().keep(aKeptListening());

    renderInAnAddress(<DownloadsDialog isOpen onClose={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: 'Music and audiobooks' })).not.toBeInTheDocument();
  });

  it('closes when the close button is pressed', async () => {
    const actor = userEvent.setup();
    const onClose = vi.fn();

    renderInAnAddress(<DownloadsDialog isOpen onClose={onClose} />);

    await actor.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadsDialog.displayName).toBe('DownloadsDialog');
  });
});
