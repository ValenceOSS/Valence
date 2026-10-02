import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdPicturePicker } from './HouseholdPicturePicker';

const uploadHouseholdPhoto = vi.hoisted(() =>
  vi.fn<(file: File) => Promise<string | null>>(() => Promise.resolve(null)),
);

vi.mock('@ValenceClient/household/fetchHousehold', () => ({ uploadHouseholdPhoto }));

const HOUSEHOLD = {
  name: 'Dan',
  colour: '#3ac47d' as const,
  avatar: { kind: 'initial' as const, font: 'gilroy' as const },
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const PICTURE = new File(['bytes'], 'face.png', { type: 'image/png' });

beforeEach(() => {
  uploadHouseholdPhoto.mockReset().mockResolvedValue(null);
});

describe('HouseholdPicturePicker', () => {
  it('offers a picture to be chosen when none has been', () => {
    render(<HouseholdPicturePicker household={HOUSEHOLD} picture={null} onPicked={vi.fn()} />);

    expect(screen.getByLabelText(/Choose a picture/)).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp,image/avif,image/gif',
    );
    expect(screen.queryByText('Pick another')).not.toBeInTheDocument();
  });

  it('sends a chosen picture and hands it on once the server has it', async () => {
    const onPicked = vi.fn();

    render(<HouseholdPicturePicker household={HOUSEHOLD} picture={null} onPicked={onPicked} />);

    await userEvent.upload(screen.getByLabelText(/Choose a picture/), PICTURE);

    expect(uploadHouseholdPhoto).toHaveBeenCalledWith(PICTURE);
    await waitFor(() => {
      expect(onPicked).toHaveBeenCalledWith(PICTURE);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says what was wrong with a picture it would not take, and keeps the old one', async () => {
    const onPicked = vi.fn();

    uploadHouseholdPhoto.mockResolvedValue('A picture has to be 6 MB or smaller.');
    render(<HouseholdPicturePicker household={HOUSEHOLD} picture={null} onPicked={onPicked} />);

    await userEvent.upload(screen.getByLabelText(/Choose a picture/), PICTURE);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A picture has to be 6 MB or smaller.',
    );
    expect(onPicked).not.toHaveBeenCalled();
  });

  it('offers another once one has been chosen', () => {
    render(<HouseholdPicturePicker household={HOUSEHOLD} picture={PICTURE} onPicked={vi.fn()} />);

    expect(screen.getByText('Pick another')).toBeInTheDocument();
  });
});
