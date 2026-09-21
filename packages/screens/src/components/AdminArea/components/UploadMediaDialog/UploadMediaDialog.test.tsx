import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadMediaDialog } from './UploadMediaDialog';
import type { Library } from '@ValenceContracts/schemas/Library';

const uploadMediaMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/uploadMedia', () => ({ uploadMedia: uploadMediaMock }));

const FILMS: Library = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const fileAt = (name: string, relativePath = ''): File => {
  const file = new File(['x'], name);

  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });

  return file;
};

beforeEach(() => {
  uploadMediaMock.mockReset();
  uploadMediaMock.mockResolvedValue({ path: '', bytes: 1 });
});

const draw = (library: Library | null = FILMS) => {
  const onClose = vi.fn();
  const onUploaded = vi.fn();

  render(<UploadMediaDialog library={library} onClose={onClose} onUploaded={onUploaded} />);

  return { onClose, onUploaded };
};

describe('UploadMediaDialog', () => {
  it('draws nothing while there is no library to upload into', () => {
    draw(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the library the files are going to', () => {
    draw();

    expect(screen.getByRole('dialog', { name: 'Upload media' })).toBeInTheDocument();
    expect(screen.getByText('Upload to Films')).toBeInTheDocument();
  });

  it('cannot upload until something has been chosen', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('lists what was chosen as waiting, leaving out what the library would not read', async () => {
    const actor = userEvent.setup();

    draw();

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [
      fileAt('Arrival.mkv'),
      fileAt('cover.jpg'),
    ]);

    const list = screen.getByRole('list', { name: 'Files to upload' });

    expect(within(list).getByText('Arrival.mkv')).toBeInTheDocument();
    expect(within(list).getByText('Waiting')).toBeInTheDocument();
    expect(within(list).queryByText('cover.jpg')).not.toBeInTheDocument();
    expect(
      screen.getByText('1 file was left out because this library does not read it.'),
    ).toBeInTheDocument();
  });

  it('keeps the folders a chosen folder had', async () => {
    const actor = userEvent.setup();

    draw();

    await actor.upload(screen.getByLabelText(/Choose a folder to upload/), [
      fileAt('Arrival.mkv', 'Arrival (2016)/Arrival.mkv'),
    ]);

    expect(screen.getByText('Arrival (2016)/Arrival.mkv')).toBeInTheDocument();
  });

  it('uploads each file to where its path says, then reports the library', async () => {
    const actor = userEvent.setup();
    const { onUploaded } = draw();

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [
      fileAt('Arrival.mkv'),
      fileAt('Dune.mkv'),
    ]);
    await actor.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith(FILMS);
    });

    expect(uploadMediaMock).toHaveBeenNthCalledWith(1, FILMS.id, 'Arrival.mkv', expect.any(File));
    expect(uploadMediaMock).toHaveBeenNthCalledWith(2, FILMS.id, 'Dune.mkv', expect.any(File));
    expect(screen.getAllByText('Uploaded')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 files uploaded');
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('says what the server said about a file it would not take, and carries on with the rest', async () => {
    const actor = userEvent.setup();
    const { onUploaded } = draw();

    uploadMediaMock.mockRejectedValueOnce(new Error('That disk is read-only to Valence.'));

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [
      fileAt('Arrival.mkv'),
      fileAt('Dune.mkv'),
    ]);
    await actor.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('That disk is read-only to Valence.')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('does not scan a library nothing arrived in', async () => {
    const actor = userEvent.setup();
    const { onUploaded } = draw();

    uploadMediaMock.mockRejectedValue(new Error('nope'));

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [fileAt('Arrival.mkv')]);
    await actor.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('nope')).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('sends only what has not arrived when somebody tries again', async () => {
    const actor = userEvent.setup();

    draw();

    uploadMediaMock.mockRejectedValueOnce(new Error('nope'));

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [
      fileAt('Arrival.mkv'),
      fileAt('Dune.mkv'),
    ]);
    await actor.click(screen.getByRole('button', { name: 'Upload' }));
    await screen.findByText('nope');

    uploadMediaMock.mockClear();

    await actor.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(uploadMediaMock).toHaveBeenCalledTimes(1);
    });

    expect(uploadMediaMock).toHaveBeenCalledWith(FILMS.id, 'Arrival.mkv', expect.any(File));
  });

  it('closes and forgets what was chosen', async () => {
    const actor = userEvent.setup();
    const { onClose } = draw();

    await actor.upload(screen.getByLabelText(/Choose files to upload/), [fileAt('Arrival.mkv')]);
    await actor.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(UploadMediaDialog.displayName).toBe('UploadMediaDialog');
  });
});
